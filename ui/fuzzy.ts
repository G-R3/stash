import { StashItem } from "../types";

// Scores
const RECENCY_BONUS = 35;
const EXACT_MATCH = 100;
const BASE_MATCH = 8;
const CONSECUTIVE_MATCH_BONUS = 15;

const RECENCY_WINDOW_MS = 1000 * 60 * 60 * 24 * 7; // maths out to 7 days

export function findFuzzyMatch(query: string, itemName: string) {
  let queryPointer = 0;
  let namePointer = 0;
  let score = 0;
  const indices = [];

  while (namePointer < itemName.length && queryPointer < query.length) {
    const queryChar = query[queryPointer];
    const nameChar = itemName[namePointer];

    if (queryChar === nameChar) {
      // add the various score bonuses
      score += BASE_MATCH;

      queryPointer++;
    }

    namePointer++;
  }

  return {
    indices,
    score,
  };
}

function calculateLinearRecencyScore(item: StashItem) {
  const age = Date.now() - item.mtime.getTime();

  if (age <= 0) return RECENCY_BONUS;
  if (age >= RECENCY_WINDOW_MS) return 0;

  return Math.round(RECENCY_BONUS * (1 - age / RECENCY_WINDOW_MS));
}

function fuzzyMatch(query: string, item: StashItem): StashItem {
  const queryLower = query.toLowerCase();
  const itemNameLower = item.name.toLowerCase();

  if (!query.trim().length) {
    return {
      ...item,
      score: calculateLinearRecencyScore(item),
    };
  }

  if (queryLower === itemNameLower) {
    return {
      ...item,
      matchedIndices: [...Array(itemNameLower.length).keys()],
      score: EXACT_MATCH + query.length + calculateLinearRecencyScore(item),
    };
  }

  const { indices, score } = findFuzzyMatch(queryLower, itemNameLower);

  return {
    ...item,
    matchedIndices: indices,
    score,
  };
}

export function fuzzy(query: string, items: StashItem[]) {
  const matchedItems = [];
  for (const item of items) {
    const match = fuzzyMatch(query, item);
    if (match) matchedItems.push(match);
  }

  matchedItems.sort((a, b) => b.score - a.score);

  return matchedItems;
}
