import { defaults, map } from "@common";
import { useReducer, useEffect } from "react";
import { uniqueId } from "lodash";
import { range, hypogeometricDist, sum } from "@math";
import { pipe } from "ezell-toolbelt";

const STATE_INIT = "state/init";
const STATE_IDLE = "state/idle";
const STATE_CALCULATING = "state/calculating";
const EVENT_ADD_ENTRY = "event/addEntry";
const EVENT_REMOVE_ENTRY = "event/removeEntry";
const EVENT_EDIT_ENTRY = "event/editEntry";
const EVENT_EDIT_HANDSIZE = "event/editHandSize";
const EVENT_EDIT_DECKSIZE = "event/editDeckSize";
const EVENT_EDIT_HEADERS = "event/editHeaders";
const EVENT_SAVE_PROBS = "event/saveProbs";

const getDisplayHeaders = (handSize) => ["Name", ...range(handSize), "Total"];

const initialState = {
  state: STATE_INIT,
  context: {
    entries: [{ ...defaults.item, id: "entry-item-original" }],
    inputHeaders: ["Name", "Count", "Remove"],
    displayHeaders: getDisplayHeaders(defaults.handSize),
    handSize: defaults.handSize,
    deckSize: defaults.deckSize
  }
};

const calculateRemainingCards = (state) => {
  const { entries, deckSize, handSize } = state.context;
  const getProb = hypogeometricDist(deckSize)(handSize);
  const actualEntries = entries.filter(
    (entry) => entry.id !== "entry-item-remaining"
  );
  const totalEntries = sum(
    ...actualEntries.map((entry) => parseInt(entry.count || 0))
  );
  const remainingCards = deckSize - totalEntries;

  const updatedEntries = [
    ...actualEntries,
    withProbs({ handSize, getProb })({
      id: "entry-item-remaining",
      name: "Remaining",
      count: remainingCards,
      probs: entries[entries.length - 1].probs
    })
  ];

  return {
    ...state,
    context: {
      ...state.context,
      entries: updatedEntries
    }
  };
};

const calcGuard = (state) => {
  const { entries, handSize, deckSize } = state.context;
  const actualEntries = entries.filter(
    (entry) => entry.id !== "entry-item-remaining"
  );
  const totalEntries = sum(
    ...actualEntries.map((entry) => parseInt(entry.count))
  );
  const hasEntries = totalEntries > 0;
  const hasValidDeckSize = deckSize > 0;
  const hasValidHandSize = handSize > 0 && handSize <= deckSize;
  const canCalculate = hasValidDeckSize && hasValidHandSize && hasEntries;
  return { ...state, state: canCalculate ? STATE_CALCULATING : STATE_IDLE };
};

const onEntryAdd = (send) => () => {
  send({
    type: EVENT_ADD_ENTRY,
    data: { ...defaults.item, id: uniqueId("entry-item") }
  });
};

const onEntryRemove = (send) => (id) => () => {
  send({ type: EVENT_REMOVE_ENTRY, data: id });
};

const onEntryEdit = (send, keyname) => (id) => (event) => {
  send({
    type: EVENT_EDIT_ENTRY,
    data: { id, value: event.target.value, keyname }
  });
};

const onSizeChange = (send, eventType) => (event) => {
  send({ type: eventType, data: parseInt(event.target.value) });
};

const addEntry = (state, event) => {
  const entry = event.data;
  const output = {
    ...state,
    context: {
      ...state.context,
      entries: [...state.context.entries, entry]
    }
  };
  return pipe(output, calcGuard, calculateRemainingCards);
};

const removeEntry = (state, event) => {
  const id = event.data;
  const output = {
    ...state,
    context: {
      ...state.context,
      entries: state.context.entries.filter((entry) => entry.id !== id)
    }
  };
  return pipe(output, calcGuard, calculateRemainingCards);
};

const editEntry = (state, event) => {
  const { id, keyname, value } = event.data;
  const output = {
    ...state,
    context: {
      ...state.context,
      entries: state.context.entries.map((entry) => {
        if (entry.id !== id) return entry;
        return { ...entry, [keyname]: value };
      })
    }
  };
  return pipe(output, calcGuard, calculateRemainingCards);
};

const saveProbs = (state, event) => {
  const entries = event.data;

  return {
    ...state,
    state: STATE_IDLE,
    context: {
      ...state.context,
      entries
    }
  };
};

const editSize = (state, event) => {
  const { type, data: value } = event;
  const keyname = type === EVENT_EDIT_HANDSIZE ? "handSize" : "deckSize";

  const withUpdatedSize = {
    ...state,
    context: {
      ...state.context,
      [keyname]: value
    }
  };
  const output = {
    ...withUpdatedSize,
    context: {
      ...withUpdatedSize.context,
      displayHeaders: getDisplayHeaders(withUpdatedSize.context.handSize)
    }
  };
  return pipe(output, calcGuard, calculateRemainingCards);
};

const editHeaders = (state, event) => {
  const { keyname, headers } = event.data;
  return {
    ...state,
    context: {
      ...state.context,
      [keyname]: headers
    }
  };
};

const rootReducer = (state = initialState, event) => {
  const reducers = {
    [STATE_IDLE]: {
      [EVENT_ADD_ENTRY]: addEntry,
      [EVENT_REMOVE_ENTRY]: removeEntry,
      [EVENT_EDIT_ENTRY]: editEntry,
      [EVENT_EDIT_HANDSIZE]: editSize,
      [EVENT_EDIT_DECKSIZE]: editSize,
      [EVENT_EDIT_HEADERS]: editHeaders
    },
    [STATE_CALCULATING]: {
      [EVENT_SAVE_PROBS]: saveProbs
    },
    [STATE_INIT]: {
      [EVENT_SAVE_PROBS]: saveProbs
    }
  };

  const reducer = reducers?.[state.state]?.[event.type];
  return reducer ? reducer(state, event) : state;
};

const asProb =
  ({ getProb, entry }) =>
  (copiesDrawn) =>
    getProb(parseInt(entry.count), copiesDrawn);

const withProbs =
  ({ handSize, getProb }) =>
  (entry) => {
    const probs = pipe(
      range(handSize),
      map(asProb({ getProb, entry })),
      map((prob) => parseFloat(prob.toFixed(2)))
    );
    const total = sum(...probs);
    return { ...entry, probs: [...probs, total], prob: total };
  };

const calculateProbs = (send) => (state) => {
  const { entries, handSize, deckSize } = state.context;
  const actualEntries = entries.filter(
    (entry) => entry.id !== "entry-item-remaining"
  );
  const totalEntries = sum(
    ...actualEntries.map((entry) => parseInt(entry.count))
  );
  const getProb = hypogeometricDist(deckSize)(handSize);
  const entriesWithProbs = actualEntries.map(withProbs({ handSize, getProb }));
  const remainingCards = deckSize - totalEntries;
  const remainingProbs = withProbs({ handSize, getProb })({
    id: "entry-item-remaining",
    name: "Remaining",
    count: remainingCards,
    probs: []
  });
  const allEntries = [...entriesWithProbs, remainingProbs];
  send({ type: EVENT_SAVE_PROBS, data: allEntries });
};

const doNothing = (..._args) => {};

export default function useCalculator() {
  const [state, send] = useReducer(rootReducer, initialState);
  const handleEntryAdd = onEntryAdd(send);
  const handleEntryRemove = onEntryRemove(send);
  const handleNameInput = onEntryEdit(send, "name");
  const handleCountInput = onEntryEdit(send, "count");
  const handleHandSize = onSizeChange(send, EVENT_EDIT_HANDSIZE);
  const handleDeckSize = onSizeChange(send, EVENT_EDIT_DECKSIZE);

  useEffect(() => {
    const effects = {
      [STATE_INIT]: calculateProbs(send),
      [STATE_CALCULATING]: calculateProbs(send),
      [STATE_IDLE]: doNothing
    };
    effects[state.state]?.(state);
  }, [state]);

  return {
    handleEntryAdd,
    handleEntryRemove,
    handleNameInput,
    handleCountInput,
    handleHandSize,
    handleDeckSize,
    state
  };
}
