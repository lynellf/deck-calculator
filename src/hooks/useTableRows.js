import { useEffect, useState } from "react";
import { hypogeometricDist, sum, range } from "@math";
import { defaults } from "@common";

const asProbList =
  (getProb = defaults.getProb, item = defaults.item) =>
  (copiesDrawn = defaults.copiesDrawn) =>
    getProb(parseInt(item.count), copiesDrawn);

const withHeader =
  ({ name, count } = defaults.item) =>
  (prob, index) => ({ header: `${index + 1}`, name, prob, count });

const asProbRow =
  (getProb = defaults.getProb, handSize = defaults.handSize) =>
  (item = defaults.item) => {
    const probs = range(handSize).map(asProbList(getProb, item));
    const total = sum(...probs);
    return [...probs, total].map(withHeader(item));
  };

/**
 * @description Fill table cells with probability headers and values
 * @param {number} handSize total cards to draw
 * @param {number} deckSize total cards in deck
 * @param {{ name: number; count: number; }[]} rowInputs
 * @returns {{ header: string; prob: number; name: string; count: number; }[]} table rows with corresponding header labels
 */
export default function useTableCells(
  handSize = defaults.handSize,
  deckSize = defaults.deckSize,
  rowInputs = defaults.rowInputs
) {
  const [probRows, setProbRows] = useState([]);
  const hasValidSize = deckSize >= 40;

  useEffect(() => {
    if (hasValidSize) {
      const getProb = hypogeometricDist(deckSize)(handSize);
      const probRows = rowInputs.map(asProbRow(getProb, handSize));
      setProbRows(probRows);
    }
  }, [handSize, deckSize, rowInputs]);

  return probRows;
}
