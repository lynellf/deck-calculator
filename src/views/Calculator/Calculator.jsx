import { useState, useEffect } from "react";
import { sum, hypogeometricDist, calculateHand } from "@math";
import styles from "./Calculator.module.css";
import { IndividualDraw, GroupTable as Table } from "@components";
import { pipe } from "ezell-toolbelt";

const ITEM = { name: "Group 1", count: 0 };

const range = num => [...Array(num)].map((_, i) => i + 1);

const simDraws = ({ deckSize = 40, handSize = 5, groups = [] }) => {
  const getProb = calculateHand(deckSize)(handSize);
  const results = range(deckSize).reverse().reduce((output, draw) => {
    const groupProbs = [...groups]
      .map(group => ({ name: group.name, prob: getProb(group.count) }))
      .sort((a, b) => b.prob - a.prob);
    const winner = groupProbs[0];
    groups = groups.map(group => {
      if (group.name !== winner.name) return group;
      return { ...group, count: group.count - 1 };
    });

    deckSize -= 1;
    output[draw] = groupProbs;
    return output;
  }, {});

  return results;
};

const toFixedFlat = (val = 2) => (arr = []) => arr.map(v => v.toFixed(val));
const applyRankFlat = (arr = []) =>
  arr.map((value, _, self) => ({
    value,
    rank: [...self].sort(byDesc).indexOf(value) + 1
  }));

const preventDefault = event => event.preventDefault();
const byDesc = (a, b) => b - a;
const applyRank = (arr = []) =>
  arr.map(subArr =>
    subArr.map((value, _, self) => ({
      value,
      rank: [...self].sort(byDesc).indexOf(value) + 1
    }))
  );

const toFixed = val => (arr = []) =>
  arr.map(subArr => subArr.map(value => value.toFixed(val)));

const handleAdd = setData => () =>
  setData(data => {
    return [...data, { ...ITEM, name: `Group ${data.length + 1}` }];
  });
const handleRemove = setData => name => () =>
  setData(
    data => (data.length > 1 ? data.filter(item => item.name !== name) : data)
  );

const grabHeaders = handSize => [...range(handSize), "Total", "Remove"];

const handleChange = (setData, deckSize) => (key, index) => event => {
  const isName = key === "name";
  if (isName) {
    setData(currentData =>
      currentData.map((item, i) => {
        if (i !== index) return item;
        return { ...item, name: event.target.value };
      })
    );
  }

  setData(currentData => {
    const newValue = parseInt(event.target.value);
    const checkedVal = !isNaN(newValue) ? newValue : 0;
    const newTotal = sum(
      ...currentData.map((item, i) => (i === index ? checkedVal : item.count))
    );

    return newTotal > deckSize
      ? currentData
      : currentData.map((item, i) => {
          return i !== index
            ? item
            : {
                ...item,
                count: checkedVal
              };
        });
  });
};

const handleNumInput = setNum => event => setNum(parseInt(event.target.value));

export default function Calculator() {
  const [handSize, setHandSize] = useState(5);
  const [deckSize, setDeckSize] = useState(40);
  const [headers, setHeaders] = useState([]);
  const [data, setData] = useState([ITEM]);
  const [probabilities, setProbabilities] = useState([]);
  const [otherGroup, setOtherGroup] = useState({
    name: "Remaining",
    count: 40
  });
  const [otherProbs, setOtherProbs] = useState([]);
  const [allProbs, setAllProbs] = useState({});
  const hasValidSize = deckSize >= 40;

  useEffect(
    () => {
      if (hasValidSize) {
        const allProbs = simDraws({
          deckSize,
          handSize,
          groups: [...data, otherGroup]
        });
        // console.log(allProbs)
        setAllProbs(allProbs);
      }
    },
    [deckSize, data, handSize, otherGroup, hasValidSize]
  );

  useEffect(() => {
    const headers = grabHeaders(handSize);
    setHeaders(headers);
  }, []);

  useEffect(
    () => {
      const groupTotal = sum(...data.map(group => group.count));
      const remaining = deckSize - groupTotal;
      setOtherGroup(group => ({ ...group, count: remaining }));
    },
    [deckSize, data]
  );

  useEffect(
    () => {
      if (hasValidSize) {
        const getProb = hypogeometricDist(deckSize)(handSize);
        const probs = range(handSize).map(copiesDrawn =>
          getProb(parseInt(otherGroup.count), copiesDrawn)
        );
        const total = sum(...probs);
        const output = pipe([...probs, total], toFixedFlat(2), applyRankFlat);
        setOtherProbs(output);
      }
    },
    [otherGroup, handSize, deckSize, hasValidSize]
  );

  useEffect(
    () => {
      const getProb = hypogeometricDist(deckSize)(handSize);
      const probabilities = data.map(item => {
        const probs = range(handSize).map(copiesDrawn =>
          getProb(parseInt(item.count), copiesDrawn)
        );
        const total = sum(...probs);
        return [...probs, total];
      });

      const output = pipe(probabilities, toFixed(2), applyRank);

      setProbabilities(output);

      const headers = grabHeaders(handSize);
      setHeaders(headers);
    },
    [handSize, deckSize, data]
  );

  return (
    <div className={styles["grid-container"]}>
      <div className={styles["calculations"]}>
        <form onSubmit={preventDefault}>
          <fieldset>
            <legend className={styles["input-legend"]}>Inputs</legend>
            <div className={styles["input-area"]}>
              <div>
                <label htmlFor="handSize">Hand Size</label>
                <input
                  type="number"
                  min="5"
                  max="6"
                  value={handSize}
                  onInput={handleNumInput(setHandSize)}
                />
              </div>
              <div>
                <label htmlFor="deckSize">Deck Size</label>
                <input
                  type="number"
                  min="40"
                  max="60"
                  value={deckSize}
                  onInput={handleNumInput(setDeckSize)}
                />
              </div>
              <button onClick={handleAdd(setData)}>Add Group</button>
            </div>
          </fieldset>
          <legend className={styles["input-legend"]}>Probabilities</legend>
          <fieldset>
            <Table
              headers={headers}
              data={data}
              probabilities={probabilities}
              handleChange={handleChange(setData, deckSize)}
              otherGroup={otherGroup}
              otherProbs={otherProbs}
              handleRemove={handleRemove(setData)}
            />
          </fieldset>
          {/* <button hidden onClick={handleAdd(setInputs)} /> */}
        </form>
      </div>

      <IndividualDraw />
    </div>
  );
}
