import { ANSI, StashItem } from "../types";
import { style } from "../utils";

// Scores
const RECENCY_BONUS = 35;
const EXACT_MATCH = 100;
const BASE_MATCH = 5;
const CONSECUTIVE_MATCH_BONUS = 8;
const GAP_PENALTY = 1;
const WORD_BOUNDARY_BONUS = 6;

const RECENCY_WINDOW_MS = 1000 * 60 * 60 * 24 * 7; // maths out to 7 days

function isWordBoundary(name: string, index: number) {
  return (
    name[index - 1] === "-" ||
    name[index - 1] === "_" ||
    name[index - 1] === " " ||
    name[index - 1] === "." ||
    name[index - 1] === "/"
  );
}

function calculateLinearRecencyScore(item: StashItem) {
  const age = Date.now() - item.mtime.getTime();

  if (age <= 0) return RECENCY_BONUS;
  if (age >= RECENCY_WINDOW_MS) return 0;

  return Math.round(RECENCY_BONUS * (1 - age / RECENCY_WINDOW_MS));
}

export function findFuzzyMatch(
  query: string,
  itemName: string,
): { matchedIndices: number[]; score: number } | null {
  let queryPointer = 0;
  let namePointer = 0;
  let score = 0;
  const matchedIndices: number[] = [];
  let previousMatch = false;

  // frt frt frt frt frt
  // first-first
  //
  while (namePointer < itemName.length && queryPointer < query.length) {
    const queryChar = query[queryPointer];
    const nameChar = itemName[namePointer];

    if (queryChar === nameChar) {
      // add the various score bonuses
      score += BASE_MATCH;

      if (previousMatch) {
        score += CONSECUTIVE_MATCH_BONUS;
      }

      if (isWordBoundary(itemName, namePointer)) {
        score += WORD_BOUNDARY_BONUS;
      }

      matchedIndices.push(namePointer);

      previousMatch = true;
      queryPointer++;
    } else {
      previousMatch = false;
      score -= GAP_PENALTY;
    }

    namePointer++;
  }

  if (queryPointer !== query.length) {
    return null;
  }

  return {
    matchedIndices,
    score,
  };
}

function fuzzyMatch(query: string, item: StashItem): StashItem | null {
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

  const result = findFuzzyMatch(queryLower, itemNameLower);

  if (!result) return null;

  //  do i want to prefer shorter names over longer names?

  return {
    ...item,
    matchedIndices: result.matchedIndices,
    score: result.score + calculateLinearRecencyScore(item),
  };
}

export function fuzzy(query: string, items: StashItem[]) {
  const matchedItems = [];
  for (const item of items) {
    const match = fuzzyMatch(query, item);
    if (match) {
      matchedItems.push(match);
    }
  }

  matchedItems.sort((a, b) => b.score - a.score);

  return matchedItems;
}

export const highlightMatchedIndices = (
  item: StashItem,
  matchedIndices: number[],
) => {
  if (!matchedIndices || matchedIndices.length === 0) {
    return item.name;
  }

  let highlightedName = "";
  for (let i = 0; i < item.name.length; i++) {
    if (matchedIndices.includes(i)) {
      highlightedName += style(item.name[i], [ANSI.cyan]);
    } else {
      highlightedName += item.name[i];
    }
  }
  return highlightedName;
};
