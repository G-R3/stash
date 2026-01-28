import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { ANSI, type Config } from "../types";
import {
  createInitialState,
  createReducer,
  keyToAction,
} from "../ui/search.state";
import { getStashItems } from "../utils";

const MOCK_CONFIG: Config = {
  stashDir: join(import.meta.dir, ".test-tmp"),
};

describe("search", () => {
  beforeEach(() => {
    mkdirSync(MOCK_CONFIG.stashDir, { recursive: true });

    writeFileSync(join(MOCK_CONFIG.stashDir, "my-file.txt"), "my-file");
    writeFileSync(join(MOCK_CONFIG.stashDir, "script.py"), "script.py");
    writeFileSync(join(MOCK_CONFIG.stashDir, "2026-01-01-todo.txt"), "todo");
    writeFileSync(join(MOCK_CONFIG.stashDir, "2026-01-01-TEST.txt"), "test4");

    mkdirSync(join(MOCK_CONFIG.stashDir, "xyz"), { recursive: true });
    mkdirSync(join(MOCK_CONFIG.stashDir, "abc"), { recursive: true });
    mkdirSync(join(MOCK_CONFIG.stashDir, "notes folder"), { recursive: true });
    mkdirSync(join(MOCK_CONFIG.stashDir, "2026-01-01-UPPERCASE"), {
      recursive: true,
    });
    mkdirSync(join(MOCK_CONFIG.stashDir, "2026-01-01-test"), {
      recursive: true,
    });
  });

  afterEach(() => {
    rmSync(MOCK_CONFIG.stashDir, { recursive: true, force: true });
  });

  describe("Initial state", () => {
    test("Should have empty query and cursor at 0", () => {
      const state = createInitialState(MOCK_CONFIG);
      expect(state.query).toBe("");
      expect(state.cursorPosition).toBe(0);
      expect(state.selectedIndex).toBe(0);
    });

    test("Should load all stash items", () => {
      const state = createInitialState(MOCK_CONFIG);
      expect(state.items).toEqual(getStashItems(MOCK_CONFIG));
    });
  });

  describe("INPUT_CHAR", () => {
    test("Should filter items that match the query (case insensitive)", () => {
      const state = createInitialState(MOCK_CONFIG);
      const result = createReducer(
        state,
        { type: "INPUT_CHAR", char: "test" },
        MOCK_CONFIG,
      );
      expect(result.state.items).toEqual(
        getStashItems(MOCK_CONFIG).filter((item) =>
          item.name.toLowerCase().includes("test"),
        ),
      );
    });

    test("Should return no items when query matches nothing", () => {
      const state = createInitialState(MOCK_CONFIG);
      const result = createReducer(
        state,
        { type: "INPUT_CHAR", char: "zzzznotfound" },
        MOCK_CONFIG,
      );
      expect(result.state.items).toHaveLength(0);
    });

    test("Should find items with spaces in name", () => {
      let state = createInitialState(MOCK_CONFIG);
      state = createReducer(
        state,
        { type: "INPUT_CHAR", char: "notes" },
        MOCK_CONFIG,
      ).state;
      state = createReducer(
        state,
        { type: "INPUT_CHAR", char: " " },
        MOCK_CONFIG,
      ).state;
      state = createReducer(
        state,
        { type: "INPUT_CHAR", char: "folder" },
        MOCK_CONFIG,
      ).state;

      expect(state.items).toEqual(
        getStashItems(MOCK_CONFIG).filter((item) =>
          item.name.toLowerCase().includes("notes folder"),
        ),
      );
    });

    test("Should reset selectedIndex to 0 when filtering", () => {
      let state = createInitialState(MOCK_CONFIG);
      state = { ...state, selectedIndex: 3 };
      const result = createReducer(
        state,
        { type: "INPUT_CHAR", char: "x" },
        MOCK_CONFIG,
      );
      expect(result.state.selectedIndex).toBe(0);
    });
  });

  describe("BACKSPACE", () => {
    test("Should do nothing at position 0 but refresh items", () => {
      const state = createInitialState(MOCK_CONFIG);
      const result = createReducer(state, { type: "BACKSPACE" }, MOCK_CONFIG);

      expect(result.state.query).toBe("");
      expect(result.state.cursorPosition).toBe(0);
      expect(result.state.items).toEqual(getStashItems(MOCK_CONFIG));
    });
  });

  describe("Selection", () => {
    test("TAB should cycle selectedIndex forward", () => {
      const state = createInitialState(MOCK_CONFIG);
      const result = createReducer(state, { type: "TAB" }, MOCK_CONFIG);

      expect(result.state.selectedIndex).toBe(1);
    });

    test("TAB should wrap around to 0", () => {
      let state = createInitialState(MOCK_CONFIG);
      const itemCount = state.items.length;
      state = { ...state, selectedIndex: itemCount - 1 };
      const result = createReducer(state, { type: "TAB" }, MOCK_CONFIG);

      expect(result.state.selectedIndex).toBe(0);
    });

    test("ARROW_DOWN should increase selectedIndex", () => {
      const state = createInitialState(MOCK_CONFIG);
      const result = createReducer(state, { type: "ARROW_DOWN" }, MOCK_CONFIG);

      expect(result.state.selectedIndex).toBe(1);
    });

    test("ARROW_DOWN should not exceed items length", () => {
      let state = createInitialState(MOCK_CONFIG);
      state = { ...state, selectedIndex: state.items.length - 1 };
      const result = createReducer(state, { type: "ARROW_DOWN" }, MOCK_CONFIG);

      expect(result.state.selectedIndex).toBe(state.items.length - 1);
    });

    test("ARROW_UP should decrease selectedIndex", () => {
      let state = createInitialState(MOCK_CONFIG);
      state = { ...state, selectedIndex: 2 };
      const result = createReducer(state, { type: "ARROW_UP" }, MOCK_CONFIG);

      expect(result.state.selectedIndex).toBe(1);
    });

    test("ARROW_UP should not go below 0", () => {
      const state = createInitialState(MOCK_CONFIG);
      const result = createReducer(state, { type: "ARROW_UP" }, MOCK_CONFIG);

      expect(result.state.selectedIndex).toBe(0);
    });
  });

  describe("CANCEL", () => {
    test("Should set done to true", () => {
      const state = createInitialState(MOCK_CONFIG);
      const result = createReducer(state, { type: "CANCEL" }, MOCK_CONFIG);

      expect(result.done).toBe(true);
    });

    test("Should reset state to initial", () => {
      let state = createInitialState(MOCK_CONFIG);
      state = createReducer(
        state,
        { type: "INPUT_CHAR", char: "test" },
        MOCK_CONFIG,
      ).state;
      state = { ...state, selectedIndex: 2 };
      const result = createReducer(state, { type: "CANCEL" }, MOCK_CONFIG);

      expect(result.state.query).toBe("");
      expect(result.state.cursorPosition).toBe(0);
      expect(result.state.selectedIndex).toBe(0);
    });
  });

  describe("DELETE_ITEM", () => {
    test("Should delete the selected item", () => {
      const initialState = createInitialState(MOCK_CONFIG);

      // move to index 1 atleast
      const state = createReducer(
        initialState,
        { type: "ARROW_DOWN" },
        MOCK_CONFIG,
      ).state;

      const result = createReducer(state, { type: "DELETE_ITEM" }, MOCK_CONFIG);

      expect(result.state.items).toHaveLength(state.items.length - 1);
    });

    test("Should not delete if no item is selected", () => {
      const initialState = createInitialState(MOCK_CONFIG);

      // use query with not result to have no items selected
      const state = createReducer(
        initialState,
        { type: "INPUT_CHAR", char: "zzzznotfound" },
        MOCK_CONFIG,
      ).state;

      // attemp to delete
      const result = createReducer(state, { type: "DELETE_ITEM" }, MOCK_CONFIG);

      expect(result.state.items).toEqual(state.items);
    });
  });

  describe("keyToAction", () => {
    test("Escape should map to CANCEL", () => {
      expect(keyToAction(ANSI.escape)).toEqual({ type: "CANCEL" });
    });

    test("Tab should map to TAB", () => {
      expect(keyToAction(ANSI.tab)).toEqual({ type: "TAB" });
    });

    test("Arrow keys should map to corresponding actions", () => {
      expect(keyToAction(ANSI.arrowLeft)).toEqual({ type: "ARROW_LEFT" });
      expect(keyToAction(ANSI.arrowRight)).toEqual({ type: "ARROW_RIGHT" });
      expect(keyToAction(ANSI.arrowUp)).toEqual({ type: "ARROW_UP" });
      expect(keyToAction(ANSI.arrowDown)).toEqual({ type: "ARROW_DOWN" });
    });

    test("Backspace keys should map to BACKSPACE", () => {
      expect(keyToAction(ANSI.backspace)).toEqual({ type: "BACKSPACE" });
      expect(keyToAction(ANSI.backspaceAlt)).toEqual({ type: "BACKSPACE" });
    });

    test("HOME keys should map to HOME", () => {
      expect(keyToAction(ANSI.home)).toEqual({ type: "HOME" });
      expect(keyToAction(ANSI.homeAlt)).toEqual({ type: "HOME" });
      expect(keyToAction(ANSI.home2)).toEqual({ type: "HOME" });
      expect(keyToAction(ANSI.cmdLeft)).toEqual({ type: "HOME" });
      expect(keyToAction(ANSI.ctrlA)).toEqual({ type: "HOME" });
    });

    test("END keys should map to END", () => {
      expect(keyToAction(ANSI.end)).toEqual({ type: "END" });
      expect(keyToAction(ANSI.endAlt)).toEqual({ type: "END" });
      expect(keyToAction(ANSI.end2)).toEqual({ type: "END" });
      expect(keyToAction(ANSI.cmdRight)).toEqual({ type: "END" });
      expect(keyToAction(ANSI.ctrlE)).toEqual({ type: "END" });
    });

    test("Word navigation keys should map correctly", () => {
      expect(keyToAction(ANSI.optionLeft)).toEqual({ type: "WORD_LEFT" });
      expect(keyToAction(ANSI.optionLeftAlt)).toEqual({ type: "WORD_LEFT" });
      expect(keyToAction(ANSI.optionRight)).toEqual({ type: "WORD_RIGHT" });
      expect(keyToAction(ANSI.optionRightAlt)).toEqual({ type: "WORD_RIGHT" });
      expect(keyToAction(ANSI.ctrlLeft)).toEqual({ type: "WORD_LEFT" });
      expect(keyToAction(ANSI.ctrlRight)).toEqual({ type: "WORD_RIGHT" });
    });

    test("Ctrl+D should map to DELETE_ITEM", () => {
      expect(keyToAction(ANSI.ctrlD)).toEqual({ type: "DELETE_ITEM" });
    });

    test("Space should map to INPUT_CHAR", () => {
      expect(keyToAction(ANSI.space)).toEqual({
        type: "INPUT_CHAR",
        char: " ",
      });
    });

    test("Regular characters should map to INPUT_CHAR", () => {
      expect(keyToAction("a")).toEqual({ type: "INPUT_CHAR", char: "a" });
      expect(keyToAction("Z")).toEqual({ type: "INPUT_CHAR", char: "Z" });
      expect(keyToAction("5")).toEqual({ type: "INPUT_CHAR", char: "5" });
    });
  });
});
