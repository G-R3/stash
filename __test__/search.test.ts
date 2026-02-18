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
      expect(state.items.length).toEqual(getStashItems(MOCK_CONFIG).length);
    });
  });

  describe("INPUT_TEXT", () => {
    test("Should filter items that match the query (case insensitive)", () => {
      const state = createInitialState(MOCK_CONFIG);
      const result = createReducer(
        state,
        { type: "INPUT_TEXT", text: "test" },
        MOCK_CONFIG,
      );
      expect(result.state.items.map((item) => item.name)).toEqual([
        "2026-01-01-test",
        "2026-01-01-TEST.txt",
      ]);
    });

    test("Should return no items when query matches nothing", () => {
      const state = createInitialState(MOCK_CONFIG);
      const result = createReducer(
        state,
        { type: "INPUT_TEXT", text: "zzzznotfound" },
        MOCK_CONFIG,
      );
      expect(result.state.items).toHaveLength(0);
    });

    test("Should find items with spaces in name", () => {
      let state = createInitialState(MOCK_CONFIG);
      state = createReducer(
        state,
        { type: "INPUT_TEXT", text: "notes" },
        MOCK_CONFIG,
      ).state;
      state = createReducer(
        state,
        { type: "INPUT_TEXT", text: " " },
        MOCK_CONFIG,
      ).state;
      state = createReducer(
        state,
        { type: "INPUT_TEXT", text: "folder" },
        MOCK_CONFIG,
      ).state;

      expect(state.items).toHaveLength(1);
      expect(state.items[0].name).toBe("notes folder");
    });

    test("Should reset selectedIndex to 0 when filtering", () => {
      let state = createInitialState(MOCK_CONFIG);
      state = { ...state, selectedIndex: 3 };
      const result = createReducer(
        state,
        { type: "INPUT_TEXT", text: "x" },
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
      expect(result.state.items.length).toBe(getStashItems(MOCK_CONFIG).length);
    });

    test("Should do nothing when query exists but cursor is at 0", () => {
      let state = createInitialState(MOCK_CONFIG);
      state = { ...state, query: "test", cursorPosition: 0 };

      const result = createReducer(state, { type: "BACKSPACE" }, MOCK_CONFIG);

      expect(result.state.query).toBe("test");
      expect(result.state.cursorPosition).toBe(0);
      expect(result.state.items).toEqual(state.items);
    });
  });

  describe("Selection", () => {
    test("TAB should cycle selectedIndex forward", () => {
      const state = createInitialState(MOCK_CONFIG);
      const result = createReducer(state, { type: "TAB" }, MOCK_CONFIG);

      expect(result.state.selectedIndex).toBe(1);
    });

    test("TAB should wrap around to 0 (including create new option)", () => {
      let state = createInitialState(MOCK_CONFIG);
      const totalOptions = state.items.length + 1; // +1 for "create new" option
      state = { ...state, selectedIndex: totalOptions - 1 };
      const result = createReducer(state, { type: "TAB" }, MOCK_CONFIG);

      expect(result.state.selectedIndex).toBe(0);
    });

    test("ARROW_DOWN should increase selectedIndex", () => {
      const state = createInitialState(MOCK_CONFIG);
      const result = createReducer(state, { type: "ARROW_DOWN" }, MOCK_CONFIG);

      expect(result.state.selectedIndex).toBe(1);
    });

    test("ARROW_DOWN should reach the create new option", () => {
      let state = createInitialState(MOCK_CONFIG);
      state = { ...state, selectedIndex: state.items.length - 1 };
      const result = createReducer(state, { type: "ARROW_DOWN" }, MOCK_CONFIG);

      expect(result.state.selectedIndex).toBe(state.items.length);
    });

    test("ARROW_DOWN should not exceed create new option index", () => {
      let state = createInitialState(MOCK_CONFIG);
      state = { ...state, selectedIndex: state.items.length };
      const result = createReducer(state, { type: "ARROW_DOWN" }, MOCK_CONFIG);

      expect(result.state.selectedIndex).toBe(state.items.length);
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

  describe("ENTER", () => {
    test("Should trigger createNew when create option is selected", () => {
      let state = createInitialState(MOCK_CONFIG);
      state = { ...state, selectedIndex: state.items.length };
      const result = createReducer(state, { type: "ENTER" }, MOCK_CONFIG);

      expect(result.done).toBe(true);
      expect(result.createNew).toBe(true);
    });

    test("Should preserve query in state when creating new item", () => {
      let state = createInitialState(MOCK_CONFIG);
      state = createReducer(
        state,
        { type: "INPUT_TEXT", text: "my-note" },
        MOCK_CONFIG,
      ).state;
      state = { ...state, selectedIndex: state.items.length };
      const result = createReducer(state, { type: "ENTER" }, MOCK_CONFIG);

      expect(result.done).toBe(true);
      expect(result.createNew).toBe(true);
      expect(result.state.query).toBe("my-note");
    });

    test("Should do nothing when a regular item is selected", () => {
      const state = createInitialState(MOCK_CONFIG);
      const result = createReducer(state, { type: "ENTER" }, MOCK_CONFIG);

      expect(result.done).toBe(false);
      expect(result.createNew).toBeUndefined();
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
        { type: "INPUT_TEXT", text: "test" },
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
        { type: "INPUT_TEXT", text: "zzzznotfound" },
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

    test("Enter should map to ENTER", () => {
      expect(keyToAction(ANSI.enter)).toEqual({ type: "ENTER" });
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

    test("Space should map to INPUT_TEXT", () => {
      expect(keyToAction(ANSI.space)).toEqual({
        type: "INPUT_TEXT",
        text: " ",
      });
    });

    test("Regular characters should map to INPUT_TEXT", () => {
      expect(keyToAction("a")).toEqual({ type: "INPUT_TEXT", text: "a" });
      expect(keyToAction("Z")).toEqual({ type: "INPUT_TEXT", text: "Z" });
      expect(keyToAction("5")).toEqual({ type: "INPUT_TEXT", text: "5" });
    });
  });
});
