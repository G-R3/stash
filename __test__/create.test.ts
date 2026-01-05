import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import {
  createInitialState,
  createReducer,
  keyToAction,
} from "../ui/create.state";
import { createItem } from "../ui/create";
import { existsSync, rmSync, mkdirSync } from "fs";
import { join } from "path";
import { ANSI, Config } from "../types";

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

  test("INPUT_CHAR should insert character at cursor position, not append to end", () => {
    const state = {
      ...createInitialState(),
      text: "hllo",
      cursorPosition: 1, // cursor after "h"
    };
    const result = createReducer(state, { type: "INPUT_CHAR", char: "e" });

    expect(result.state.text).toBe("hello");
    expect(result.state.cursorPosition).toBe(2);
  });

  test("INPUT_CHAR should insert at beginning when cursor is at position 0", () => {
    const state = {
      ...createInitialState(),
      text: "ello",
      cursorPosition: 0,
    };
    const result = createReducer(state, { type: "INPUT_CHAR", char: "h" });

    expect(result.state.text).toBe("hello");
    expect(result.state.cursorPosition).toBe(1);
  });

  test("SPACE should insert space at cursor position, not append to end", () => {
    const state = {
      ...createInitialState(),
      text: "helloworld",
      cursorPosition: 5, // cursor after "hello"
    };
    const result = createReducer(state, { type: "SPACE" });

    expect(result.state.text).toBe("hello world");
    expect(result.state.cursorPosition).toBe(6);
  });

  test("SPACE should insert at beginning when cursor is at position 0", () => {
    const state = {
      ...createInitialState(),
      text: "hello",
      cursorPosition: 0,
    };
    const result = createReducer(state, { type: "SPACE" });

    expect(result.state.text).toBe(" hello");
    expect(result.state.cursorPosition).toBe(1);
  });

  test("BACKSPACE should delete character before cursor position", () => {
    const state = {
      ...createInitialState(),
      text: "hello world",
      cursorPosition: 6,
    };
    const result = createReducer(state, { type: "BACKSPACE" });

    expect(result.state.text).toBe("helloworld");
    expect(result.state.cursorPosition).toBe(5);
  });

  test("BACKSPACE at end of text should delete last character", () => {
    const state = {
      ...createInitialState(),
      text: "test",
      cursorPosition: 4, // at end
    };
    const result = createReducer(state, { type: "BACKSPACE" });

    expect(result.state.text).toBe("tes");
    expect(result.state.cursorPosition).toBe(3);
  });

  test("BACKSPACE in middle of word should delete character before cursor", () => {
    const state = {
      ...createInitialState(),
      text: "test test",
      cursorPosition: 4, // after first "test"
    };
    const result = createReducer(state, { type: "BACKSPACE" });

    expect(result.state.text).toBe("tes test");
    expect(result.state.cursorPosition).toBe(3);
  });

  test("BACKSPACE at position 0 should do nothing", () => {
    const state = {
      ...createInitialState(),
      text: "hello",
      cursorPosition: 0,
    };
    const result = createReducer(state, { type: "BACKSPACE" });

    expect(result.state.text).toBe("hello");
    expect(result.state.cursorPosition).toBe(0);
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

  test("HOME should move cursor to beginning of text", () => {
    const state = {
      ...createInitialState(),
      text: "hello world",
      cursorPosition: 6,
    };
    const result = createReducer(state, { type: "HOME" });

    expect(result.state.cursorPosition).toBe(0);
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

  test("END should move cursor to end of text", () => {
    const state = {
      ...createInitialState(),
      text: "hello world",
      cursorPosition: 0,
    };
    const result = createReducer(state, { type: "END" });

    expect(result.state.cursorPosition).toBe(11);
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

  test("WORD_LEFT should move cursor to previous word boundary", () => {
    const state = {
      ...createInitialState(),
      text: "hello world test",
      cursorPosition: 16, // at end
    };

    const result1 = createReducer(state, { type: "WORD_LEFT" });
    expect(result1.state.cursorPosition).toBe(12); // start of "test"

    const result2 = createReducer(result1.state, { type: "WORD_LEFT" });
    expect(result2.state.cursorPosition).toBe(6); // start of "world"

    const result3 = createReducer(result2.state, { type: "WORD_LEFT" });
    expect(result3.state.cursorPosition).toBe(0); // start of "hello"
  });

  test("WORD_LEFT should handle cursor in middle of word", () => {
    const state = {
      ...createInitialState(),
      text: "hello world",
      cursorPosition: 8, // middle of "world"
    };
    const result = createReducer(state, { type: "WORD_LEFT" });

    expect(result.state.cursorPosition).toBe(6); // start of "world"
  });

  test("WORD_RIGHT should move cursor to next word boundary", () => {
    const state = {
      ...createInitialState(),
      text: "hello world test",
      cursorPosition: 0,
    };

    const result1 = createReducer(state, { type: "WORD_RIGHT" });
    expect(result1.state.cursorPosition).toBe(6); // start of "world"

    const result2 = createReducer(result1.state, { type: "WORD_RIGHT" });
    expect(result2.state.cursorPosition).toBe(12); // start of "test"

    const result3 = createReducer(result2.state, { type: "WORD_RIGHT" });
    expect(result3.state.cursorPosition).toBe(16); // end of text
  });

  test("WORD_RIGHT should handle cursor in middle of word", () => {
    const state = {
      ...createInitialState(),
      text: "hello world",
      cursorPosition: 2, // middle of "hello"
    };
    const result = createReducer(state, { type: "WORD_RIGHT" });

    expect(result.state.cursorPosition).toBe(6); // start of "world"
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
});
