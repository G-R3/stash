import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import {
  createStashItem,
  deleteStashItem,
  listStashItems,
  stashIsEmpty,
} from "../operations";
import type { Config } from "../types";

const MOCK_CONFIG: Config = {
  stashDir: join(import.meta.dir, ".test-tmp"),
};

describe("operations", () => {
  beforeEach(() => {
    mkdirSync(MOCK_CONFIG.stashDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(MOCK_CONFIG.stashDir, { recursive: true, force: true });
  });

  describe("createStashItem", () => {
    test("creates a directory when isFile is false", () => {
      const result = createStashItem(
        { text: "my-folder", isFile: false, prefix: false },
        MOCK_CONFIG,
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe("Created directory: my-folder");
      expect(existsSync(join(MOCK_CONFIG.stashDir, "my-folder"))).toBe(true);
    });

    test("creates a file when isFile is true", () => {
      const result = createStashItem(
        { text: "notes.txt", isFile: true, prefix: false },
        MOCK_CONFIG,
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe("Created file: notes.txt");
      expect(existsSync(join(MOCK_CONFIG.stashDir, "notes.txt"))).toBe(true);
    });

    test("fails when target already exists", () => {
      mkdirSync(join(MOCK_CONFIG.stashDir, "existing"), { recursive: true });

      const result = createStashItem(
        { text: "existing", isFile: false, prefix: false },
        MOCK_CONFIG,
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe("File/directory already exists: existing");
    });
  });

  describe("listStashItems", () => {
    test("returns items sorted by most recent first", () => {
      const olderPath = join(MOCK_CONFIG.stashDir, "older.txt");
      const newerPath = join(MOCK_CONFIG.stashDir, "newer.txt");

      writeFileSync(olderPath, "older");
      writeFileSync(newerPath, "newer");

      const now = Date.now();
      utimesSync(olderPath, new Date(now - 120_000), new Date(now - 120_000));
      utimesSync(newerPath, new Date(now - 30_000), new Date(now - 30_000));

      const items = listStashItems(MOCK_CONFIG);

      expect(items[0]?.name).toBe("newer.txt");
      expect(items[1]?.name).toBe("older.txt");
    });
  });

  describe("deleteStashItem", () => {
    test("deletes existing file", () => {
      const filePath = join(MOCK_CONFIG.stashDir, "delete-me.txt");
      writeFileSync(filePath, "delete me");

      const deleted = deleteStashItem(filePath);

      expect(deleted).toBe(true);
      expect(existsSync(filePath)).toBe(false);
    });

    test("returns false when path does not exist", () => {
      const deleted = deleteStashItem(
        join(MOCK_CONFIG.stashDir, "missing-item.txt"),
      );

      expect(deleted).toBe(false);
    });
  });

  describe("stashIsEmpty", () => {
    test("returns true for empty stash", () => {
      expect(stashIsEmpty(MOCK_CONFIG)).toBe(true);
    });

    test("returns false when stash has items", () => {
      writeFileSync(join(MOCK_CONFIG.stashDir, "item.txt"), "item");

      expect(stashIsEmpty(MOCK_CONFIG)).toBe(false);
    });
  });
});
