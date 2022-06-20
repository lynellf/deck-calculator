import { saveAs } from "file-saver";
import { fileOpen, fileSave, supported } from "browser-fs-access";
import {
  EVENT_EDIT_COMBO,
  EVENT_ADD_ENTRY,
  EVENT_EDIT_ENTRY,
  EVENT_LOAD_CONTEXT,
  EVENT_REMOVE_COMBO,
  EVENT_REMOVE_ENTRY,
  EVENT_EDIT_TOTAL_HANDS,
  EVENT_EDIT_SHUFFLES,
  EVENT_GET_OPENING_HAND
} from "./constants";
import { uniqueId } from "lodash";
import { defaults } from "@common";

export const onTotalHandsChange = (send) => (event) =>
  send({ type: EVENT_EDIT_TOTAL_HANDS, data: parseInt(event.target.value) });

export const onShufflesChange = (send) => (event) =>
  send({ type: EVENT_EDIT_SHUFFLES, data: parseInt(event.target.value) });

export const onCalculateHand = (send) => () =>
  send({ type: EVENT_GET_OPENING_HAND });

export const onEntryAdd = (send) => () => {
  send({
    type: EVENT_ADD_ENTRY,
    data: { ...defaults.item, id: uniqueId("entry-item") }
  });
};

export const onEntryRemove = (send) => (id) => () => {
  send({ type: EVENT_REMOVE_ENTRY, data: id });
};

export const onEntryEdit = (send, keyname) => (id) => (event) => {
  const isTag = keyname === "tags";
  const value = isTag ? event.target.value.split(",") : event.target.value;

  send({
    type: EVENT_EDIT_ENTRY,
    data: { id, value, keyname }
  });
};

export const onSizeChange = (send, eventType) => (event) => {
  send({ type: eventType, data: parseInt(event.target.value) });
};

export const onComboAdd = (send) => (combo) => () => {
  const id = uniqueId("combo-");
  send({
    type: EVENT_EDIT_COMBO,
    data: { ...combo, id: combo.id ?? id }
  });
};

export const onComboRemove = (send) => (id) => () => {
  send({ type: EVENT_REMOVE_COMBO, data: { id } });
};

export const onComboEdit = (send) => (combo) => {
  send({ type: EVENT_EDIT_COMBO, data: combo });
};

export const onFileRead = (send) => async () => {
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

export const handleSave = (context) => () => {
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
