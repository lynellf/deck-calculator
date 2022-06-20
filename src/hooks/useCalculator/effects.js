import { hypogeometricDist, sum, calculateHand } from "@math";
import { pipe } from "ezell-toolbelt";
import { withProbs } from "./utils";
import {
  EVENT_SAVE_PROBS,
  EVENT_GET_OPENING_HAND,
  EVENT_SET_OPENING_HAND
} from "./constants";
import {
  asMostFreqCards,
  getOpeningHandFreq,
  createDeckFromEntries
} from "./utils";

const byCount = (entry) => parseInt(entry.count);
const byTagProb = (table, { tags, prob }) => {
  tags.forEach((tag) => {
    const hasTag = table.has(tag);
    if (!hasTag) {
      table.set(tag, prob);
    }

    if (hasTag) {
      table.set(tag, table.get(tag) * prob);
    }
  });
  return table;
};
export const byNonEntry = (entry) => entry.id !== "entry-item-remaining";

export const calculateProbs = (send) => (state) => {
  const { entries, handSize, deckSize, combos } = state.context;
  const actualEntries = entries.filter(byNonEntry);
  const totalEntries = sum(...actualEntries.map(byCount));
  const getProb = hypogeometricDist(deckSize)(handSize);
  const getTotalProb = calculateHand(deckSize, handSize);
  const combosWithProbs = combos.map((combo) => ({
    ...combo,
    prob: combo.groups.reduce((acc, { count }) => {
      const prob = getTotalProb(count);
      return acc * prob;
    }, 1)
  }));
  const totalComboProb =
    1 -
    combosWithProbs.reduce((acc, combo) => {
      const { prob } = combo;
      const failRate = 1 - prob;
      return acc * failRate;
    }, 1);
  const entriesWithProbs = actualEntries.map(withProbs({ handSize, getProb }));
  const remainingCards = deckSize - totalEntries;
  const remainingProbs = withProbs({ handSize, getProb })({
    id: "entry-item-remaining",
    name: "Remaining",
    count: remainingCards,
    probs: []
  });
  const tagGroups = [...entriesWithProbs.reduce(byTagProb, new Map())];
  const tagFailRate = tagGroups.reduce((total, [_tag, prob]) => {
    const failProb = 1 - prob;
    return total * failProb;
  }, 1);
  const tagSuccessRate = 1 - tagFailRate;
  const allEntries = [...entriesWithProbs, remainingProbs];

  send({
    type: EVENT_SAVE_PROBS,
    data: {
      entries: allEntries,
      tagGroups,
      tagSuccessRate,
      combos: combosWithProbs,
      totalComboProb
    }
  });
};

export const doNothing = (_state) => {};

export const getOpeningHands = (send) => (state) => {
  const { entries, totalHands, handSize, totalShuffles, combos } =
    state.context;
  const cards = createDeckFromEntries(entries, combos);
  const averageOpening = pipe(
    getOpeningHandFreq(cards, handSize, totalHands, totalShuffles),
    asMostFreqCards
  );

  send({
    type: EVENT_SET_OPENING_HAND,
    data: { averageOpening }
  });
};
