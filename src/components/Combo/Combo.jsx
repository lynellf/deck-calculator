import { useReducer } from "react";
import { uniqueId } from "lodash";

const initialGroup = { id: uniqueId("combo-group-"), members: [], count: 0 };

const initialCombo = {
  name: "",
  groups: [initialGroup]
};

const initialState = {
  state: "idle",
  context: initialCombo
};

const EVENT_EDIT_NAME = "event/editname";
const EVENT_ADD_GROUP = "event/addgroup";
const EVENT_REMOVE_GROUP = "event/removegroup";
const EVENT_REPLACE_GROUP = "event/editgroup";

const editName = (state, event) => {
  const { name } = event;
  return {
    ...state,
    context: {
      ...state.context,
      name
    }
  };
};

const addGroup = (state, _event) => {
  return {
    ...state,
    context: {
      ...state.context,
      groups: [
        ...state.context.groups,
        { id: uniqueId("combo-group-"), members: [] }
      ]
    }
  };
};

const removeGroup = (state, event) => {
  const { id } = event.data;
  return {
    ...state,
    context: {
      ...state.context,
      groups:
        state.context.groups.length > 1
          ? state.context.groups.filter((group) => group.id !== id)
          : state.context.groups
    }
  };
};

const replaceGroup = (state, event) => {
  const { group } = event.data;
  return {
    ...state,
    context: {
      ...state.context,
      groups: state.context.groups.map((g) => (g.id === group.id ? group : g))
    }
  };
};

const rootReducer = (state, event) => {
  const reducer = {
    idle: {
      [EVENT_EDIT_NAME]: editName,
      [EVENT_ADD_GROUP]: addGroup,
      [EVENT_REMOVE_GROUP]: removeGroup,
      [EVENT_REPLACE_GROUP]: replaceGroup
    }
  };

  return reducer[state.state][event.type](state, event);
};

// callbacks

const handleNameInput = (send) => (event) =>
  send({ type: EVENT_EDIT_NAME, name: event.target.value });
const handleGroupEdit = (send, id, entries) => (event) => {
  const selectedIds = [...event.target.selectedOptions];
  const count = selectedIds.reduce((acc, entryId) => {
    const entry = entries.find((entry) => entry.id === entryId.value);
    return parseInt(entry.count) + acc;
  }, 0);

  send({
    type: EVENT_REPLACE_GROUP,
    data: {
      group: {
        id,
        members: [...event.target.selectedOptions].map((el) => el.value),
        count
      }
    }
  });
};

const handleGroupAdd = (send) => () => send({ type: EVENT_ADD_GROUP });
const handleGroupRemove = (send, id) => () =>
  send({ type: EVENT_REMOVE_GROUP, data: { id } });

const handleSave = (closeFn, saveFn, combo) => () => {
  saveFn(combo)();
  closeFn();
};

const handleRemove = (closeFn, removeFn, combo) => () => {
  removeFn(combo.id)();
  closeFn();
};
export const Combo = ({
  handleComboAdd,
  handleComboRemove,
  entries,
  combo = initialCombo,
  handleClose
}) => {
  const [state, send] = useReducer(rootReducer, {
    ...initialState,
    context: combo
  });

  const { context } = state;
  const canRemove = combo.id !== undefined;

  return (
    <div>
      <h2>Add/Edit Combo</h2>
      <div>
        <label>Name</label>
        <input
          type="text"
          value={context.name}
          onInput={handleNameInput(send)}
        />
      </div>
      <div>
        <label>Groups</label>
        <div>
          {context.groups.map((group, index) => (
            <div key={group.id}>
              <label>Group {index + 1}</label>
              <select
                multiple
                onChange={handleGroupEdit(send, group.id, entries)}
                value={group.members}
              >
                {entries.map(({ name, id }) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
              <button onClick={handleGroupRemove(send, group.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
      <button onClick={handleGroupAdd(send)}>Add Group</button>
      <div>
        {canRemove && (
          <button onClick={handleRemove(handleClose, handleComboRemove, combo)}>
            Remove Combo
          </button>
        )}
        <button
          onClick={handleSave(handleClose, handleComboAdd, state.context)}
        >
          Save
        </button>
      </div>
    </div>
  );
};
