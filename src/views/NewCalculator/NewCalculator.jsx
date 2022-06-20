import { useState } from "react";
import { useCalculator } from "@hooks";
import {
  Table,
  TableBody as Body,
  TableHead as Head,
  TableRow as Row,
  TableCell as Cell,
  HeaderCell,
  Combo,
  Modal
} from "@components";

const comboState = {
  isOpen: false,
  selectedCombo: undefined
};

const closeModal = (setState) => () => setState(comboState);
const openWithEdits = (setState, selectedCombo) => () => {
  setState({ isOpen: true, selectedCombo });
};
const openModal = (setState) => () =>
  setState((state) => ({ ...state, isOpen: true }));

export default function NewCalculator() {
  const [{ isOpen, selectedCombo }, setState] = useState(comboState);
  const handleClose = closeModal(setState);

  const {
    state: ctx,
    handleEntryAdd,
    handleEntryRemove,
    handleNameInput,
    handleCountInput,
    handleHandSize,
    handleDeckSize,
    handleFileOpen,
    handleSave,
    handleComboAdd,
    handleComboRemove,
    handleCalculateHand,
    handleTotalHandsChange,
    handleShufflesChange
  } = useCalculator();

  const {
    context: {
      inputHeaders,
      displayHeaders,
      entries,
      deckSize,
      handSize,
      combos,
      totalComboProb,
      averageOpening,
      totalHands,
      totalShuffles
    }
  } = ctx;

  return (
    <div>
      <div id="appBar">
        <h1>Deck Calculator</h1>
      </div>
      <div id="inputArea">
        <div>
          <h2>Inputs</h2>
          <div>
            <label htmlFor="handSize">Hand Size</label>
            <input
              type="number"
              min="5"
              max="6"
              value={handSize}
              onInput={handleHandSize}
            />
          </div>
          <div>
            <label htmlFor="deckSize">Deck Size</label>
            <input
              type="number"
              min="40"
              max="60"
              value={deckSize}
              onInput={handleDeckSize}
            />
          </div>
          <button onClick={handleEntryAdd}>Add Entry</button>
        </div>
        <Table>
          <Head>
            <Row>
              {inputHeaders.map(({ label, id }) => (
                <HeaderCell key={id}>{label}</HeaderCell>
              ))}
            </Row>
          </Head>
          <Body>
            {entries.map((entry, index) => {
              const isLastRow = index === entries.length - 1;
              const hasOneRemaining = entries.length === 2;

              if (!isLastRow) {
                return (
                  <Row key={entry.id}>
                    <Cell>
                      <input
                        placeholder="Name"
                        type="text"
                        value={entry.name}
                        onInput={handleNameInput(entry.id)}
                      />
                    </Cell>
                    <Cell>
                      <input
                        placeholder="Count"
                        type="number"
                        value={entry.count}
                        onInput={handleCountInput(entry.id)}
                        min={0}
                        max={deckSize}
                      />
                    </Cell>
                    <Cell>
                      <button
                        disabled={hasOneRemaining}
                        onClick={handleEntryRemove(entry.id)}
                      >
                        ➖
                      </button>
                    </Cell>
                  </Row>
                );
              }

              return (
                <Row key={entry.id}>
                  <Cell>{entry.name}</Cell>
                  <Cell>{entry.count}</Cell>
                  <Cell />
                  <Cell />
                </Row>
              );
            })}
          </Body>
        </Table>
      </div>

      <div id="standardProbs">
        <Table>
          <Head>
            <Row>
              {displayHeaders.map(({ label, id }) => (
                <HeaderCell key={id}>{label}</HeaderCell>
              ))}
            </Row>
          </Head>
          <Body>
            {entries.map((entry) => (
              <Row key={entry.id}>
                <Cell>{entry.name}</Cell>
                {entry?.probs?.map((prob, index) => (
                  <Cell key={index}>{prob.toFixed(2)}</Cell>
                ))}
              </Row>
            ))}
          </Body>
        </Table>
      </div>

      <div>
        <h2>Combos - Success Rate: {totalComboProb.toFixed(2)}</h2>
        <Table>
          <Head>
            <Row>
              <HeaderCell>Name</HeaderCell>
              <HeaderCell>Probability</HeaderCell>
              <HeaderCell>Edit</HeaderCell>
              <HeaderCell>Remove</HeaderCell>
            </Row>
          </Head>
          <Body>
            {combos.map((combo) => (
              <Row key={combo.id}>
                <Cell>{combo.name}</Cell>
                <Cell>{combo?.prob?.toFixed(2) ?? 0}</Cell>
                <Cell>
                  <button onClick={openWithEdits(setState, combo)}>Edit</button>
                </Cell>
                <Cell>
                  <button onClick={handleComboRemove(combo.id)}>Remove</button>
                </Cell>
              </Row>
            ))}
          </Body>
        </Table>
        <div>
          <div>
            <button onClick={openModal(setState)}>Add Combo</button>
          </div>
        </div>
      </div>

      <div>
        <h2>Opening Hand</h2>
        <div>
          <label htmlFor="totalHands">Total Hands</label>
          <input
            type="number"
            value={totalHands}
            onInput={handleTotalHandsChange}
          />
        </div>
        <div>
          <label htmlFor="totalShuffles">Shuffles Per Hand</label>
          <input
            type="number"
            value={totalShuffles}
            onInput={handleShufflesChange}
          />
        </div>

        <div>
          <button onClick={handleCalculateHand}>Calculate</button>
        </div>

        <ol>
          {averageOpening.map((card, index) => (
            <li key={index}>{card}</li>
          ))}
        </ol>
      </div>

      <div>
        <h2>Load / Save Settings</h2>
        <div style={{ display: "flex", justifyContent: "space-evenly" }}>
          <button onClick={handleFileOpen}>Open Settings File</button>
          <button onClick={handleSave(ctx.context)}>Save Settings</button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={handleClose}>
        <Combo
          {...{
            handleComboAdd,
            handleComboRemove,
            entries,
            combo: selectedCombo,
            handleClose
          }}
        />
      </Modal>
    </div>
  );
}
