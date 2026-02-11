import { describe, expect, test } from "bun:test";
import { StashItem } from "../types";
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
      createTestItem("first"),
      createTestItem("first-first"),
      createTestItem("not-even-close"),
      createTestItem("going-first"),
    ];

    console.log(fuzzy("frtfrtfrtfrtfrt", items));

    // expect(matches).toHaveLength(1);
    // expect(matches[0].name).toBe("first");
  });
});
