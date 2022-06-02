export const concatStyles = (...styles) => [...styles].join(" ");

export const applyRankFlat = (arr = []) =>
  arr.map((value, _, self) => ({
    value,
    rank: [...self].sort(byDesc).indexOf(value) + 1
  }));

export const applyRank = (arr = []) =>
  arr.map((subArr) =>
    subArr.map((value, _, self) => ({
      value,
      rank: [...self].sort(byDesc).indexOf(value) + 1
    }))
  );
export const toFixed =
  (val) =>
  (arr = []) =>
    arr.map((subArr) => subArr.map((value) => value.toFixed(val)));

export const defaults = {
  getProb: (_totalCopies, _copiesDrawn) => 1,
  item: { name: "", count: 0, prob: 0, subProbs: [] },
  handSize: 5,
  deckSize: 40,
  copiesDrawn: 0,
  rowInputs: []
};

export const map = (fn) => (arr) => arr.map(fn);
