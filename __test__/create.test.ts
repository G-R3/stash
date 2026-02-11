import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { ANSI, type Config } from "../types";
import { createItem } from "../ui/create";
import {
  createInitialState,
  createReducer,
  keyToAction,
} from "../ui/create.state";

const MOCK_CONFIG: Config = {
  stashDir: join(import.meta.dir, ".test-tmp"),
};

describe("create", () => {
  beforeEach(() => {
    mkdirSync(MOCK_CONFIG.stashDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(MOCK_CONFIG.stashDir, { recursive: true, force: true });
  });

  test("Should initialize with provided name and cursor at end", () => {
    const name = "my-note";
    const state = createInitialState(name);

    expect(state.text).toBe("my-note");
    expect(state.cursorPosition).toBe(name.length);
    expect(state.focusedField).toBe(0);
    expect(state.isFile).toBe(false);
    expect(state.prefix).toBe(false);
  });

  test("Should initialize with empty name when no argument is provided", () => {
    const state = createInitialState();

    expect(state.text).toBe("");
    expect(state.cursorPosition).toBe(0);
  });

  test("Should create a directory", () => {
    const state = { ...createInitialState(), text: "my-folder", isFile: false };
    const result = createItem(state, MOCK_CONFIG);

    expect(result.success).toBe(true);
    expect(result.message).toBe("Created directory: my-folder");
    expect(existsSync(join(MOCK_CONFIG.stashDir, "my-folder"))).toBe(true);
  });

  test("Should update focusedField when TAB is pressed", () => {
    const state = createInitialState();
    const result = createReducer(state, { type: "TAB" });

    expect(result.done).toBe(false);
    expect(result.state.focusedField).toBe(1);

    const result2 = createReducer(result.state, { type: "TAB" });
    expect(result2.done).toBe(false);
    expect(result2.state.focusedField).toBe(2);

    const result3 = createReducer(result2.state, { type: "TAB" });
    expect(result3.done).toBe(false);
    expect(result3.state.focusedField).toBe(0);
  });

  test("Should update isFile when field TABBed to focus and Arrows are pressed", () => {
    const state = createInitialState();
    const result = createReducer(state, { type: "ARROW_RIGHT" });

    expect(result.done).toBe(false);
    expect(result.state.isFile).toBe(false);
    expect(result.state.focusedField).not.toBe(1);

    const result2 = createReducer(state, { type: "TAB" });
    expect(result2.done).toBe(false);
    expect(result2.state.focusedField).toBe(1);

    const result3 = createReducer(result2.state, { type: "ARROW_RIGHT" });
    expect(result3.done).toBe(false);
    expect(result3.state.isFile).toBe(true);

    const result4 = createReducer(result3.state, { type: "ARROW_LEFT" });
    expect(result4.done).toBe(false);
    expect(result4.state.isFile).toBe(false);
  });

  test("Should update prefix when field TABBed to focus and SPACE is pressed", () => {
    const state = createInitialState();
    const result = createReducer(state, { type: "SPACE" });
    expect(result.done).toBe(false);
    expect(result.state.prefix).toBe(false);
    expect(result.state.focusedField).not.toBe(2);

    const result2 = createReducer(state, { type: "TAB" });
    expect(result2.done).toBe(false);
    expect(result2.state.focusedField).not.toBe(2);

    const result3 = createReducer(result2.state, { type: "TAB" });
    expect(result3.done).toBe(false);
    expect(result3.state.focusedField).toBe(2);

    const result4 = createReducer(result3.state, { type: "SPACE" });
    expect(result4.done).toBe(false);
    expect(result4.state.prefix).toBe(true);

    const result5 = createReducer(result4.state, { type: "SPACE" });
    expect(result5.done).toBe(false);
    expect(result5.state.prefix).toBe(false);
  });

  test("Should create a file", () => {
    const state = {
      ...createInitialState(),
      text: "my-file.txt",
      isFile: true,
    };
    const result = createItem(state, MOCK_CONFIG);

    expect(result.success).toBe(true);
    expect(result.message).toBe("Created file: my-file.txt");
    expect(existsSync(join(MOCK_CONFIG.stashDir, "my-file.txt"))).toBe(true);
  });

  test("Should create a file with prefix", () => {
    const state = {
      ...createInitialState(),
      text: "my-file.txt",
      isFile: true,
      prefix: true,
    };

    const currentDate = new Date().toISOString().split("T")[0];
    const expectedName = `${currentDate}-my-file.txt`;

    const result = createItem(state, MOCK_CONFIG);
    expect(result.success).toBe(true);
    expect(result.message).toBe(`Created file: ${expectedName}`);
    expect(existsSync(join(MOCK_CONFIG.stashDir, expectedName))).toBe(true);
  });

  test("Should create a directory with prefix", () => {
    const state = {
      ...createInitialState(),
      text: "my-folder",
      isFile: false,
      prefix: true,
    };
    const currentDate = new Date().toISOString().split("T")[0];
    const expectedName = `${currentDate}-my-folder`;

    const result = createItem(state, MOCK_CONFIG);
    expect(result.success).toBe(true);
    expect(result.message).toBe(`Created directory: ${expectedName}`);
    expect(existsSync(join(MOCK_CONFIG.stashDir, expectedName))).toBe(true);
  });

  test("Should fail if file/directory already exists", () => {
    const state = { ...createInitialState(), text: "existing", isFile: false };

    mkdirSync(join(MOCK_CONFIG.stashDir, "existing"));
    const result = createItem(state, MOCK_CONFIG);

    expect(result.success).toBe(false);
    expect(result.message).toBe("File/directory already exists: existing");
  });

  test("Should fail if name is empty and SUBMIT is pressed", () => {
    const state = createInitialState();
    const result = createReducer(state, { type: "SUBMIT" });

    expect(result.done).toBe(false);
    expect(result.error).toBe("Name cannot be empty");
  });

  test("BACKSPACE should do nothing when not focused on text field", () => {
    const state = {
      ...createInitialState(),
      text: "hello",
      cursorPosition: 3,
      focusedField: 1,
    };
    const result = createReducer(state, { type: "BACKSPACE" });

    expect(result.state.text).toBe("hello");
    expect(result.state.cursorPosition).toBe(3);
  });

  test("HOME should do nothing when not focused on text field", () => {
    const state = {
      ...createInitialState(),
      text: "hello",
      cursorPosition: 3,
      focusedField: 1,
    };
    const result = createReducer(state, { type: "HOME" });

    expect(result.state.cursorPosition).toBe(3);
  });

  test("END should do nothing when not focused on text field", () => {
    const state = {
      ...createInitialState(),
      text: "hello",
      cursorPosition: 0,
      focusedField: 2,
    };
    const result = createReducer(state, { type: "END" });

    expect(result.state.cursorPosition).toBe(0);
  });

  test("WORD_LEFT and WORD_RIGHT should do nothing when not focused on text field", () => {
    const state = {
      ...createInitialState(),
      text: "hello world",
      cursorPosition: 5,
      focusedField: 1,
    };

    const resultLeft = createReducer(state, { type: "WORD_LEFT" });
    expect(resultLeft.state.cursorPosition).toBe(5);

    const resultRight = createReducer(state, { type: "WORD_RIGHT" });
    expect(resultRight.state.cursorPosition).toBe(5);
  });
});

describe("keyToAction navigation mappings", () => {
  test("Escape should map to CANCEL action", () => {
    expect(keyToAction(ANSI.escape)).toEqual({ type: "CANCEL" });
  });

  test("Tab should map to TAB action", () => {
    expect(keyToAction(ANSI.tab)).toEqual({ type: "TAB" });
  });

  test("Enter should map to SUBMIT action", () => {
    expect(keyToAction(ANSI.enter)).toEqual({ type: "SUBMIT" });
  });

  test("Arrow keys should map to corresponding ARROW actions", () => {
    expect(keyToAction(ANSI.arrowLeft)).toEqual({ type: "ARROW_LEFT" });
    expect(keyToAction(ANSI.arrowRight)).toEqual({ type: "ARROW_RIGHT" });
    expect(keyToAction(ANSI.arrowUp)).toEqual({ type: "ARROW_UP" });
    expect(keyToAction(ANSI.arrowDown)).toEqual({ type: "ARROW_DOWN" });
  });

  test("Space key should map to SPACE action", () => {
    expect(keyToAction(ANSI.space)).toEqual({ type: "SPACE" });
  });

  test("HOME keys should map to HOME action", () => {
    expect(keyToAction(ANSI.home)).toEqual({ type: "HOME" });
    expect(keyToAction(ANSI.homeAlt)).toEqual({ type: "HOME" });
    expect(keyToAction(ANSI.home2)).toEqual({ type: "HOME" });
    expect(keyToAction(ANSI.cmdLeft)).toEqual({ type: "HOME" });
    expect(keyToAction(ANSI.ctrlA)).toEqual({ type: "HOME" });
  });

  test("END keys should map to END action", () => {
    expect(keyToAction(ANSI.end)).toEqual({ type: "END" });
    expect(keyToAction(ANSI.endAlt)).toEqual({ type: "END" });
    expect(keyToAction(ANSI.end2)).toEqual({ type: "END" });
    expect(keyToAction(ANSI.cmdRight)).toEqual({ type: "END" });
    expect(keyToAction(ANSI.ctrlE)).toEqual({ type: "END" });
  });

  test("Option+arrow keys should map to WORD navigation actions", () => {
    expect(keyToAction(ANSI.optionLeft)).toEqual({ type: "WORD_LEFT" });
    expect(keyToAction(ANSI.optionLeftAlt)).toEqual({ type: "WORD_LEFT" });
    expect(keyToAction(ANSI.optionRight)).toEqual({ type: "WORD_RIGHT" });
    expect(keyToAction(ANSI.optionRightAlt)).toEqual({ type: "WORD_RIGHT" });
  });

  test("Ctrl+arrow keys (Windows/Linux) should map to WORD navigation actions", () => {
    expect(keyToAction(ANSI.ctrlLeft)).toEqual({ type: "WORD_LEFT" });
    expect(keyToAction(ANSI.ctrlRight)).toEqual({ type: "WORD_RIGHT" });
  });

  test("Backspace keys should map to BACKSPACE action", () => {
    expect(keyToAction(ANSI.backspace)).toEqual({ type: "BACKSPACE" });
    expect(keyToAction(ANSI.backspaceAlt)).toEqual({ type: "BACKSPACE" });
  });

  test("Regular characters should map to INPUT_TEXT action", () => {
    expect(keyToAction("a")).toEqual({ type: "INPUT_TEXT", text: "a" });
    expect(keyToAction("Z")).toEqual({ type: "INPUT_TEXT", text: "Z" });
    expect(keyToAction("5")).toEqual({ type: "INPUT_TEXT", text: "5" });
  });
});
