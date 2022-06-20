import { range, hypogeometricDist, sum } from "@math";
import { STATE_CALCULATING, STATE_IDLE } from "./constants";
import { uniqueId } from "lodash";
import { pipe } from "ezell-toolbelt";
import { map } from "@common";

export const asProb =
  ({ getProb, entry }) =>
  (copiesDrawn) =>
    getProb(parseInt(entry.count), copiesDrawn);

export const withProbs =
  ({ handSize, getProb }) =>
  (entry) => {
    const probs = pipe(
      range(handSize),
      map(asProb({ getProb, entry })),
      map((prob) => parseFloat(prob.toFixed(2)))
    );
    const total = sum(...probs);
    return { ...entry, probs: [...probs, total], prob: total };
  };

export const calculateRemainingCards = (state) => {
  const { entries, deckSize, handSize, combos } = state.context;
  const getProb = hypogeometricDist(deckSize)(handSize);
  const actualEntries = entries.filter(
    (entry) => entry.id !== "entry-item-remaining"
  );
  const totalEntries = sum(
    ...actualEntries.map((entry) => parseInt(entry.count || 0))
  );
  const remainingCards = deckSize - totalEntries;

  const updatedEntries = [
    ...actualEntries,
    withProbs({ handSize, getProb })({
      id: "entry-item-remaining",
      name: "Remaining",
      count: remainingCards,
      probs: entries[entries.length - 1].probs
    })
  ];

  const updatedCombos = combos
    .map((combo) => {
      const { groups } = combo;
      const updatedGroups = groups.reduce((acc, group) => {
        const isValid = group.members.every((memberId) =>
          updatedEntries.find((entry) => entry.id === memberId)
        );
        if (!isValid) {
          return acc;
        }

        const updatedCount = group.members.reduce((acc, memberId) => {
          const entry =
            updatedEntries.find((entry) => entry.id === memberId) ?? 0;
          const total = acc + parseInt(entry.count);
          return total;
        }, 0);

        return [...acc, { ...group, count: updatedCount }];
      }, []);

      return { ...combo, groups: updatedGroups };
    })
    .filter((combo) => {
      const { groups, id } = combo;
      const prevCombo = combos.find((c) => c.id === id);
      const isValid = groups.length === prevCombo.groups.length;

      return isValid;
    });

  return {
    ...state,
    context: {
      ...state.context,
      entries: updatedEntries,
      combos: updatedCombos
    }
  };
};

export const calcGuard = (state) => {
  const { entries, handSize, deckSize } = state.context;
  const actualEntries = entries.filter(
    (entry) => entry.id !== "entry-item-remaining"
  );
  const totalEntries = sum(
    ...actualEntries.map((entry) => parseInt(entry.count))
  );
  const hasEntries = totalEntries > 0;
  const hasValidDeckSize = deckSize > 0;
  const hasValidHandSize = handSize > 0 && handSize <= deckSize;
  const hasValidEntries = actualEntries.every(
    (entry) => parseInt(entry.count) <= deckSize
  );
  const canCalculate =
    hasValidDeckSize && hasValidHandSize && hasEntries && hasValidEntries;
  return { ...state, state: canCalculate ? STATE_CALCULATING : STATE_IDLE };
};

export const asHeader = (label) => ({
  label,
  id: uniqueId("header")
});

export const getDisplayHeaders = (handSize) => [
  ["Name", "name"],
  ...range(handSize).map((count) => [`${count}`, count]),
  ["Total", "total"]
];

export const shuffleArray = (array, times = 1) => {
  if (times === 0) {
    return array;
  }

  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return shuffleArray(array, times - 1);
};

export const createDeckFromEntries = (entries = [], combos = []) =>
  entries.reduce((acc, { name, count, id }) => {
    const cards = range(parseInt(count)).map(() => {
      const combo = combos.find((c) =>
        c.groups.some((g) => g.members.includes(id))
      );
      return combo ? combo.name : name;
    });
    return [...acc, ...cards];
  }, []);

// shuffles the deck and tallies cards within a slice totaling the hand size after each iteration
export const getOpeningHandFreq = (
  deck = [],
  handSize = 5,
  totalHands = 100,
  totalShuffles = 1
) =>
  range(totalHands).reduce((table, _) => {
    const shuffledDeck = shuffleArray(deck, totalShuffles);
    const hand = shuffledDeck.slice(0, handSize);
    const sortedHand = hand.sort();
    const keyName = sortedHand.join("///");
    const hasHand = table.has(keyName);

    if (hasHand) {
      const count = table.get(keyName);
      table.set(keyName, count + 1);
    }

    if (!hasHand) {
      table.set(keyName, 1);
    }

    return table;
  }, new Map());

// returns list of most common cards in the hand
export const asMostFreqCards = (handTable = new Map()) => {
  const output =
    [...handTable]
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => key.split("///"))?.[0] ?? [];
  return output;
};
