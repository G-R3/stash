import { describe, expect, test } from "bun:test";
import type { StashItem } from "../types";
import { findFuzzyMatch, fuzzy } from "../ui/fuzzy";

function createTestItem(name: string, daysAgo: number = 0): StashItem {
  const mtime = new Date();
  mtime.setDate(mtime.getDate() - daysAgo);
  return {
    name,
    path: `./stash/${name}`,
    score: 0,
    size: 0,
    type: "directory",
    mtime,
    matchedIndices: [],
  };
}

describe("fuzzy finding", () => {
  test("empty query matches everything with most recent at the top", () => {
    const items = [
      createTestItem("first"),
      createTestItem("fourth", 5),
      createTestItem("second", 2),
      createTestItem("third", 10),
    ];

    const matches = fuzzy("", items);

    expect(matches).toHaveLength(items.length);
    expect(matches[0].name).toBe("first");
    expect(matches[1].name).toBe("second");
    expect(matches[2].name).toBe("fourth");
    expect(matches[3].name).toBe("third");
  });

  test("exact match should be the highest score", () => {
    const items = [
      createTestItem("first-first"),
      createTestItem("first", 5),
      createTestItem("firstly"),
    ];

    const matches = fuzzy("first", items);

    expect(matches).toHaveLength(3);
    expect(matches[0].name).toBe("first");
  });

  test("supports subsequence matching like rds and connpool", () => {
    const items = [
      createTestItem("random-notes"),
      createTestItem("polling-requests"),
    ];

    const rdnMatches = fuzzy("rdn", items).map((item) => item.name);
    expect(rdnMatches).toContain("random-notes");

    const pollReqMatches = fuzzy("pollreq", items).map((item) => item.name);
    expect(pollReqMatches).toContain("polling-requests");
  });

  test("prefers shorter names when scores and recency tie", () => {
    const items = [createTestItem("bb"), createTestItem("aaaa")];

    const matches = fuzzy("", items);
    expect(matches[0].name).toBe("bb");
  });

  test("findFuzzyMatch returns ordered matched indices", () => {
    const result = findFuzzyMatch(
      "connpool",
      "connection-pool",
      "connection-pool",
    );
    expect(result).not.toBeNull();
    expect(result?.matchedIndices).toEqual([0, 1, 2, 3, 11, 12, 13, 14]);
  });
});
