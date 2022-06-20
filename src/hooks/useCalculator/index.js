import { useReducer, useEffect } from "react";
import {
  onEntryAdd,
  onEntryRemove,
  onEntryEdit,
  onSizeChange,
  onComboAdd,
  onComboRemove,
  onComboEdit,
  onFileRead,
  handleSave,
  onTotalHandsChange,
  onShufflesChange,
  onCalculateHand
} from "./callbacks";
import { rootReducer, initialState } from "./reducers";
import { calculateProbs, doNothing, getOpeningHands } from "./effects";
import {
  STATE_CALCULATING,
  STATE_CALCULATING_HAND,
  STATE_IDLE,
  EVENT_EDIT_HANDSIZE,
  EVENT_EDIT_DECKSIZE
} from "./constants";

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
  const handleTotalHandsChange = onTotalHandsChange(send);
  const handleShufflesChange = onShufflesChange(send);
  const handleCalculateHand = onCalculateHand(send);

  useEffect(() => {
    const effects = {
      [STATE_CALCULATING]: calculateProbs(send),
      [STATE_CALCULATING_HAND]: getOpeningHands(send),
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
    handleCalculateHand,
    handleTotalHandsChange,
    handleShufflesChange,
    state
  };
}
