import {
  calcGuard,
  calculateRemainingCards,
  asHeader,
  getDisplayHeaders
} from "./utils";
import { pipe } from "ezell-toolbelt";
import {
  STATE_CALCULATING,
  STATE_IDLE,
  STATE_CALCULATING_HAND,
  EVENT_ADD_COMBO,
  EVENT_ADD_ENTRY,
  EVENT_EDIT_COMBO,
  EVENT_EDIT_DECKSIZE,
  EVENT_EDIT_ENTRY,
  EVENT_EDIT_HANDSIZE,
  EVENT_EDIT_HEADERS,
  EVENT_LOAD_CONTEXT,
  EVENT_REMOVE_COMBO,
  EVENT_REMOVE_ENTRY,
  EVENT_SAVE_PROBS,
  EVENT_GET_OPENING_HAND,
  EVENT_EDIT_SHUFFLES,
  EVENT_EDIT_TOTAL_HANDS,
  EVENT_SET_OPENING_HAND
} from "./constants";
import { defaults } from "@common";

export const addEntry = (state, event) => {
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

export const removeEntry = (state, event) => {
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

export const editEntry = (state, event) => {
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

export const saveProbs = (state, event) => {
  const { entries, tagGroups, tagSuccessRate, combos, totalComboProb } =
    event.data;

  return {
    ...state,
    state: STATE_IDLE,
    context: {
      ...state.context,
      entries,
      tagGroups,
      tagSuccessRate,
      combos,
      totalComboProb
    }
  };
};

export const editSize = (state, event) => {
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

export const editHeaders = (state, event) => {
  const { keyname, headers } = event.data;
  return {
    ...state,
    context: {
      ...state.context,
      [keyname]: headers
    }
  };
};

export const loadContext = (state, event) => {
  const context = event.data;

  return {
    ...state,
    context: {
      ...state.context,
      ...context
    }
  };
};

export const upsertCombo = (state, event) => {
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

export const removeCombo = (state, event) => {
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

const setValue =
  (key, newState = STATE_IDLE) =>
  (state, event) => {
    const { value } = event.data;
    return {
      ...state,
      state: newState,
      context: {
        ...state.context,
        [key]: value
      }
    };
  };

const calculateHand = (state, _event) => {
  return {
    ...state,
    state: STATE_CALCULATING_HAND
  };
};

const setOpeningHand = (state, event) => {
  const { averageOpening } = event.data;

  return {
    ...state,
    state: STATE_IDLE,
    context: {
      ...state.context,
      averageOpening
    }
  };
};

export const initialState = {
  state: STATE_CALCULATING,
  context: {
    entries: [{ ...defaults.item, id: "entry-item-original" }],
    inputHeaders: ["Name", "Count", "Remove"].map(asHeader),
    combos: [],
    tagSuccessRate: 0,
    displayHeaders: getDisplayHeaders(defaults.handSize),
    handSize: defaults.handSize,
    deckSize: defaults.deckSize,
    totalHands: 100,
    totalShuffles: 1,
    totalComboProb: 0,
    averageOpening: []
  }
};

export const rootReducer = (state = initialState, event) => {
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
      [EVENT_EDIT_COMBO]: upsertCombo,
      [EVENT_EDIT_TOTAL_HANDS]: setValue("totalHands"),
      [EVENT_EDIT_SHUFFLES]: setValue("totalShuffles"),
      [EVENT_GET_OPENING_HAND]: calculateHand
    },
    [STATE_CALCULATING]: {
      [EVENT_SAVE_PROBS]: saveProbs
    },
    [STATE_CALCULATING_HAND]: {
      [EVENT_SET_OPENING_HAND]: setOpeningHand
    }
  };

  const reducer = reducers?.[state.state]?.[event.type];
  return reducer ? reducer(state, event) : state;
};
