import { useEffect, useState } from "react";
import { sum, range, hypogeometricDist } from "@math";
import { pipe } from "ezell-toolbelt";
import { applyRankFlat, defaults, map } from "@common";

const asRowItem =
  (count = 0) =>
  (prob, index) => ({ header: `${index + 1}`, name: "Remaining", prob, count });

/**
 * @description Determines remaining cards that aren't defined by the user
 * @param {number} deckSize total cards in the deck
 * @param {number} handSize total cards drawn
 * @param {{ name: string; count: number; prob: number; }[]} otherRows user defined rows
 * @returns {{ name: string; count: number; }} row containing the difference between user defined rows and deck size
 */
export default function useLastRow(
  deckSize = defaults.deckSize,
  handSize = defaults.handSize,
  otherRows = []
) {
  const [row, setRow] = useState([]);

  useEffect(() => {
    const hasValidSize = deckSize >= 40;
    if (hasValidSize) {
      const rowTotal = sum(...otherRows.map((row) => row.count));
      const remaining = deckSize - rowTotal;
      const getProb = hypogeometricDist(deckSize)(handSize);
      const probs = range(handSize).map((copiesDrawn) =>
        getProb(parseInt(remaining), copiesDrawn)
      );
      const total = sum(...probs);
      const output = pipe(
        [...probs, total],
        toFixedFlat(2),
        applyRankFlat,
        map(asRowItem(remaining))
      );
      setRow(output);
    }
  }, [deckSize, handSize]);

  return row;
}
