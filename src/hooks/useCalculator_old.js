import { useReducer, useEffect } from "react";
import { defaults, map } from "@common";
import { uniqueId } from "lodash";
import { range, hypogeometricDist, sum, calculateHand } from "@math";
import { pipe } from "ezell-toolbelt";
import { saveAs } from "file-saver";
import { fileOpen, fileSave, supported } from "browser-fs-access";

const STATE_IDLE = "state/idle";
const STATE_CALCULATING = "state/calculating";
const EVENT_ADD_ENTRY = "event/addEntry";
const EVENT_REMOVE_ENTRY = "event/removeEntry";
const EVENT_EDIT_ENTRY = "event/editEntry";
const EVENT_EDIT_HANDSIZE = "event/editHandSize";
const EVENT_EDIT_DECKSIZE = "event/editDeckSize";
const EVENT_EDIT_HEADERS = "event/editHeaders";
const EVENT_SAVE_PROBS = "event/saveProbs";
const EVENT_LOAD_CONTEXT = "event/loadContext";
const EVENT_ADD_COMBO = "event/addCombo";
const EVENT_REMOVE_COMBO = "event/removeCombo";
const EVENT_EDIT_COMBO = "event/editCombo";

// CONTEXT / STATE
const asHeader = (label) => ({
  label,
  id: uniqueId("header")
});

const getDisplayHeaders = (handSize) => [
  ["Name", "name"],
  ...range(handSize).map((count) => [`${count}`, count]),
  ["Total", "total"]
];

const initialState = {
  state: STATE_CALCULATING,
  context: {
    entries: [{ ...defaults.item, id: "entry-item-original" }],
    inputHeaders: ["Name", "Count", "Remove"].map(asHeader),
    combos: [],
    tagSuccessRate: 0,
    displayHeaders: getDisplayHeaders(defaults.handSize),
    handSize: defaults.handSize,
    deckSize: defaults.deckSize
  }
};

const onFileRead = (send) => async () => {
  const blob = await fileOpen({
    mimeTypes: ["application/json"],
    extensions: [".dcalc"],
    description: "Deck Calculator Settings",
    startIn: "downloads"
  });
  const json = await blob.text();
  const context = JSON.parse(json);
  send({ type: EVENT_LOAD_CONTEXT, data: context });
};

const handleSave = (context) => () => {
  const options = {
    filename: "settings.dcalc",
    extensions: [".dcalc"],
    startIn: "downloads"
  };
  const blob = new Blob([JSON.stringify(context)], {
    type: "application/json"
  });

  if (!supported) {
    return saveAs(blob, "settings.dcalc");
  }

  fileSave(blob, options);
};

const calculateRemainingCards = (state) => {
  const { entries, deckSize, handSize, combos } = state.context;
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

  const updatedCombos = combos
    .map((combo) => {
      const { groups } = combo;
      const updatedGroups = groups.reduce((acc, group) => {
        const isValid = group.members.every((memberId) =>
          updatedEntries.find((entry) => entry.id === memberId)
        );
        if (!isValid) {
          return acc;
        }

        const updatedCount = group.members.reduce((acc, memberId) => {
          const entry =
            updatedEntries.find((entry) => entry.id === memberId) ?? 0;
          const total = acc + parseInt(entry.count);
          return total;
        }, 0);

        return [...acc, { ...group, count: updatedCount }];
      }, []);

      return { ...combo, groups: updatedGroups };
    })
    .filter((combo) => {
      const { groups, id } = combo;
      const prevCombo = combos.find((c) => c.id === id);
      const isValid = groups.length === prevCombo.groups.length;

      return isValid;
    });

  return {
    ...state,
    context: {
      ...state.context,
      entries: updatedEntries,
      combos: updatedCombos
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

// CALLBACKS
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
  const isTag = keyname === "tags";
  const value = isTag ? event.target.value.split(",") : event.target.value;

  send({
    type: EVENT_EDIT_ENTRY,
    data: { id, value, keyname }
  });
};

const onSizeChange = (send, eventType) => (event) => {
  send({ type: eventType, data: parseInt(event.target.value) });
};

const onComboAdd = (send) => (combo) => () => {
  const id = uniqueId("combo-");
  send({
    type: EVENT_ADD_COMBO,
    data: { ...combo, id }
  });
};

const onComboRemove = (send) => (id) => () => {
  send({ type: EVENT_REMOVE_COMBO, data: { id } });
};

const onComboEdit = (send) => (combo) => {
  send({ type: EVENT_EDIT_COMBO, data: combo });
};

// REDUCERS
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
  const { entries, tagGroups, tagSuccessRate, combos } = event.data;

  return {
    ...state,
    state: STATE_IDLE,
    context: {
      ...state.context,
      entries,
      tagGroups,
      tagSuccessRate,
      combos
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

const loadContext = (state, event) => {
  const context = event.data;

  return {
    ...state,
    context
  };
};

const upsertCombo = (state, event) => {
  const { name, groups, id, count } = event.data;
  const oldCombos = state.context.combos;
  const hasCombo = oldCombos.find((combo) => combo.id === id) !== undefined;

  return {
    ...state,
    state: STATE_CALCULATING,
    context: {
      ...state.context,
      combos: hasCombo
        ? oldCombos.map((c) => (c.id === id ? { name, groups, id, count } : c))
        : [...state.context.combos, { name, groups, id, count }]
    }
  };
};

const removeCombo = (state, event) => {
  const { id } = event.data;
  const prevCombos = state.context.combos;
  const newCombos = prevCombos.filter((combo) => combo.id !== id);
  return {
    ...state,
    state: STATE_CALCULATING,
    context: {
      ...state.context,
      combos: newCombos
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
      [EVENT_EDIT_HEADERS]: editHeaders,
      [EVENT_LOAD_CONTEXT]: loadContext,
      [EVENT_ADD_COMBO]: upsertCombo,
      [EVENT_REMOVE_COMBO]: removeCombo,
      [EVENT_EDIT_COMBO]: upsertCombo
    },
    [STATE_CALCULATING]: {
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
const byCount = (entry) => parseInt(entry.count);
const byTagProb = (table, { tags, prob }) => {
  tags.forEach((tag) => {
    const hasTag = table.has(tag);
    if (!hasTag) {
      table.set(tag, prob);
    }

    if (hasTag) {
      table.set(tag, table.get(tag) * prob);
    }
  });
  return table;
};
const byNonEntry = (entry) => entry.id !== "entry-item-remaining";
const calculateProbs = (send) => (state) => {
  const { entries, handSize, deckSize, combos } = state.context;
  const actualEntries = entries.filter(byNonEntry);
  const totalEntries = sum(...actualEntries.map(byCount));
  const getProb = hypogeometricDist(deckSize)(handSize);
  const getTotalProb = calculateHand(deckSize, handSize);
  const combosWithProbs = combos.map((combo) => ({
    ...combo,
    prob: combo.groups.reduce((acc, { count }) => {
      const prob = getTotalProb(count);
      return acc * prob;
    }, 1)
  }));
  const entriesWithProbs = actualEntries.map(withProbs({ handSize, getProb }));
  const remainingCards = deckSize - totalEntries;
  const remainingProbs = withProbs({ handSize, getProb })({
    id: "entry-item-remaining",
    name: "Remaining",
    count: remainingCards,
    probs: []
  });
  const tagGroups = [...entriesWithProbs.reduce(byTagProb, new Map())];
  const tagFailRate = tagGroups.reduce((total, [_tag, prob]) => {
    const failProb = 1 - prob;
    return total * failProb;
  }, 1);
  const tagSuccessRate = 1 - tagFailRate;
  const allEntries = [...entriesWithProbs, remainingProbs];
  send({
    type: EVENT_SAVE_PROBS,
    data: {
      entries: allEntries,
      tagGroups,
      tagSuccessRate,
      combos: combosWithProbs
    }
  });
};

const doNothing = (_state) => {};

export default function useCalculator() {
  const [state, send] = useReducer(rootReducer, initialState);
  const handleEntryAdd = onEntryAdd(send);
  const handleEntryRemove = onEntryRemove(send);
  const handleComboAdd = onComboAdd(send);
  const handleComboRemove = onComboRemove(send);
  const handleComboEdit = onComboEdit(send);
  const handleNameInput = onEntryEdit(send, "name");
  const handleCountInput = onEntryEdit(send, "count");
  const handleHandSize = onSizeChange(send, EVENT_EDIT_HANDSIZE);
  const handleDeckSize = onSizeChange(send, EVENT_EDIT_DECKSIZE);
  const handleTagInput = onEntryEdit(send, "tags");
  const handleFileOpen = onFileRead(send);

  useEffect(() => {
    const effects = {
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
    handleSave,
    handleFileOpen,
    handleTagInput,
    handleComboAdd,
    handleComboRemove,
    handleComboEdit,
    state
  };
}
