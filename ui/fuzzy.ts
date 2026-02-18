import { ANSI, type StashItem } from "../types";
import { style } from "../utils";

// Scores
const RECENCY_BONUS = 35;
const EXACT_MATCH_BONUS = 10_000;
const BASE_MATCH = 5;
const CONSECUTIVE_MATCH_BONUS = 8;
const GAP_PENALTY = 1;
const WORD_BOUNDARY_BONUS = 6;
const START_POSITION_MAX_BONUS = 10;

const RECENCY_WINDOW_MS = 1000 * 60 * 60 * 24 * 7; // maths out to 7 days

const BOUNDARY_CHARS = new Set(["-", "_", " ", ".", "/"]);

const isLowerCase = (char: string) => char >= "a" && char <= "z";
const isUpperCase = (char: string) => char >= "A" && char <= "Z";
const isDigit = (char: string) => char >= "0" && char <= "9";
const isAlpha = (char: string) =>
  isLowerCase(char) || isUpperCase(char) || isDigit(char);

function isWordBoundary(name: string, index: number) {
  if (index === 0) {
    return true;
  }

  const previousChar = name[index - 1];
  const currentChar = name[index];

  if (BOUNDARY_CHARS.has(previousChar)) {
    return true;
  }

  // we treat camelCase transitions as boundaries
  if (isLowerCase(previousChar) && isUpperCase(currentChar)) {
    return true;
  }

  // we treat alpha<->digit transitions as boundaries
  if (
    (isDigit(previousChar) && !isDigit(currentChar) && isAlpha(currentChar)) ||
    (!isDigit(previousChar) && isAlpha(previousChar) && isDigit(currentChar))
  ) {
    return true;
  }

  return false;
}

function calculateLinearRecencyScore(item: StashItem) {
  const age = Date.now() - item.mtime.getTime();

  if (age <= 0) return RECENCY_BONUS;
  if (age >= RECENCY_WINDOW_MS) return 0;

  return Math.round(RECENCY_BONUS * (1 - age / RECENCY_WINDOW_MS));
}

export function findFuzzyMatch(
  query: string,
  normalizedName: string,
  originalName: string = normalizedName,
): { matchedIndices: number[]; score: number } | null {
  let queryPointer = 0;
  let score = 0;
  const matchedIndices: number[] = [];
  let previousMatchIndex = -1;

  for (
    let namePointer = 0;
    namePointer < normalizedName.length && queryPointer < query.length;
    namePointer++
  ) {
    const queryChar = query[queryPointer];
    const nameChar = normalizedName[namePointer];

    if (queryChar !== nameChar) {
      continue;
    }

    score += BASE_MATCH;

    if (previousMatchIndex !== -1) {
      const gapSize = namePointer - previousMatchIndex - 1;
      score -= gapSize * GAP_PENALTY;

      if (namePointer === previousMatchIndex + 1) {
        score += CONSECUTIVE_MATCH_BONUS;
      }
    }

    if (isWordBoundary(originalName, namePointer)) {
      score += WORD_BOUNDARY_BONUS;
    }

    matchedIndices.push(namePointer);
    previousMatchIndex = namePointer;
    queryPointer++;
  }

  if (queryPointer !== query.length) {
    return null;
  }

  const firstMatchIndex = matchedIndices[0] ?? 0;
  score += Math.max(0, START_POSITION_MAX_BONUS - firstMatchIndex);

  return {
    matchedIndices,
    score,
  };
}

function fuzzyMatch(query: string, item: StashItem): StashItem | null {
  const queryLower = query.toLowerCase();
  const itemNameLower = item.name.toLowerCase();

  if (!query.length) {
    return {
      ...item,
      score: calculateLinearRecencyScore(item),
    };
  }

  if (queryLower === itemNameLower) {
    return {
      ...item,
      matchedIndices: [...Array(itemNameLower.length).keys()],
      score:
        EXACT_MATCH_BONUS + query.length + calculateLinearRecencyScore(item),
    };
  }

  const result = findFuzzyMatch(queryLower, itemNameLower, item.name);

  if (!result) return null;

  return {
    ...item,
    matchedIndices: result.matchedIndices,
    score: result.score + calculateLinearRecencyScore(item),
  };
}

export function fuzzy(query: string, items: StashItem[]) {
  const matchedItems: StashItem[] = [];
  const normalizedQuery = query.toLowerCase();

  for (const item of items) {
    const match = fuzzyMatch(query, item);
    if (match) {
      matchedItems.push(match);
    }
  }

  matchedItems.sort((a, b) => {
    // tie breakers. the order is like this: exact match, score, recency, name length, and alphabetical
    const aIsExact =
      normalizedQuery.length > 0 && a.name.toLowerCase() === normalizedQuery;
    const bIsExact =
      normalizedQuery.length > 0 && b.name.toLowerCase() === normalizedQuery;

    if (aIsExact !== bIsExact) {
      return Number(bIsExact) - Number(aIsExact);
    }

    if (b.score !== a.score) {
      return b.score - a.score;
    }

    const mtimeDifference = b.mtime.getTime() - a.mtime.getTime();
    if (mtimeDifference !== 0) {
      return mtimeDifference;
    }

    if (a.name.length !== b.name.length) {
      return a.name.length - b.name.length;
    }

    return a.name.localeCompare(b.name);
  });

  return matchedItems;
}

export const highlightMatchedIndices = (
  item: StashItem,
  matchedIndices: number[],
) => {
  if (!matchedIndices || matchedIndices.length === 0) {
    return item.name;
  }

  const matchedSet = new Set(matchedIndices);
  let highlightedName = "";
  for (let i = 0; i < item.name.length; i++) {
    if (matchedSet.has(i)) {
      highlightedName += style(item.name[i], [ANSI.cyan]);
    } else {
      highlightedName += item.name[i];
    }
  }
  return highlightedName;
};
