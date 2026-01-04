import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { createInitialState, createReducer } from "../ui/create.state";
import { createItem } from "../ui/create";
import { existsSync, rmSync, mkdirSync } from "fs";
import { join } from "path";

const TEST_DIR = join(import.meta.dir, ".test-tmp");

describe("create", () => {
  beforeEach(() => {
    mkdirSync(TEST_DIR, { recursive: true });
    process.chdir(TEST_DIR);
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  test("Should create a directory", () => {
    const state = { ...createInitialState(), text: "my-folder", isFile: false };
    const result = createItem(state);

    expect(result.success).toBe(true);
    expect(result.message).toBe("Created directory: my-folder");
    expect(existsSync(join(TEST_DIR, "my-folder"))).toBe(true);
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
    expect(result.state.prefix).toBe(true);
    expect(result.state.focusedField).not.toBe(2);

    const result2 = createReducer(state, { type: "TAB" });
    expect(result2.done).toBe(false);
    expect(result2.state.focusedField).not.toBe(2);

    const result3 = createReducer(result2.state, { type: "TAB" });
    expect(result3.done).toBe(false);
    expect(result3.state.focusedField).toBe(2);

    const result4 = createReducer(result3.state, { type: "SPACE" });
    expect(result4.done).toBe(false);
    expect(result4.state.prefix).toBe(false);
  });

  test("Should create a file", () => {
    const state = {
      ...createInitialState(),
      text: "my-file.txt",
      isFile: true,
    };
    const result = createItem(state);

    expect(result.success).toBe(true);
    expect(result.message).toBe("Created file: my-file.txt");
    expect(existsSync(join(TEST_DIR, "my-file.txt"))).toBe(true);
  });

  test("Should fail if file/directory already exists", () => {
    const state = { ...createInitialState(), text: "existing", isFile: false };

    mkdirSync(join(TEST_DIR, "existing"));
    const result = createItem(state);

    expect(result.success).toBe(false);
    expect(result.message).toBe("File/directory already exists: existing");
  });

  test("Should fail if name is empty and SUBMIT is pressed", () => {
    const state = createInitialState();
    const result = createReducer(state, { type: "SUBMIT" });

    expect(result.done).toBe(false);
    expect(result.error).toBe("Name cannot be empty");
  });
});
