import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { createInitialState, createReducer } from "../ui/create.state";
import { createItem } from "../ui/create";
import { existsSync, rmSync, mkdirSync } from "fs";
import { join } from "path";
import { Config } from "../types";

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
});
