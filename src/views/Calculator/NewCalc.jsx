import { useCalculator } from "@hooks";
import {
  Table,
  TableBody as Body,
  TableHead as Head,
  TableRow as Row,
  TableCell as Cell,
  HeaderCell
} from "@components";

export default function NewCalc() {
  const {
    state: ctx,
    handleEntryAdd,
    handleEntryRemove,
    handleNameInput,
    handleCountInput,
    handleHandSize,
    handleDeckSize,
    handleFileOpen,
    handleSave
  } = useCalculator();

  const {
    context: { inputHeaders, displayHeaders, entries, deckSize, handSize }
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
              {inputHeaders.map((header) => (
                <HeaderCell key={header}>{header}</HeaderCell>
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
                        ???
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
                </Row>
              );
            })}
          </Body>
        </Table>
      </div>

      <div id="displayArea">
        <Table>
          <Head>
            <Row>
              {displayHeaders.map((header) => (
                <HeaderCell key={header}>{header}</HeaderCell>
              ))}
            </Row>
          </Head>
          <Body>
            {entries.map((entry) => (
              <Row key={entry.id}>
                <Cell>{entry.name}</Cell>
                {entry?.probs?.map((prob, index) => (
                  <Cell key={index}>{prob}</Cell>
                ))}
              </Row>
            ))}
          </Body>
        </Table>
      </div>

      <div>
        <h2>Load / Save Settings</h2>
        <div style={{ display: "flex", justifyContent: "space-evenly" }}>
          <button onClick={handleFileOpen}>Open Settings File</button>
          <button onClick={handleSave(ctx.context)}>Save Settings</button>
        </div>
      </div>
    </div>
  );
}
