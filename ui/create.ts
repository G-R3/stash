import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ANSI, type Config, type State } from "../types";
import {
  cleanUp,
  clearScreen,
  currentDate,
  getTerminalSize,
  style,
  write,
  writeLine,
} from "../utils";
import { createInitialState, createReducer, keyToAction } from "./create.state";

/**
 * Handles rendering the create TUI.
 * Can chose between creating a file or a directory and if file/directory should
 * be prefixed with the current date.
 **/
export function createUI(config: Config, initialName?: string) {
  let state = createInitialState(initialName);

  clearScreen();

  process.stdin.on("data", (data) => {
    const key = data.toString();
    const action = keyToAction(key);

    if (!action) return;

    const result = createReducer(state, action);

    if (result.done) {
      clearScreen();
      cleanUp();

      if (action.type === "SUBMIT") {
        const createResult = createItem(state, config);

        writeLine(
          style(createResult.message, [
            createResult.success ? ANSI.green : ANSI.red,
          ]),
        );

        process.exit(createResult.success ? 0 : 1);
      } else {
        process.exit(0);
      }
    }

    state = result.state;
    const error = "error" in result ? result.error : undefined;
    render(state, error);
  });

  // https://stackoverflow.com/questions/5006821/nodejs-how-to-read-keystrokes-from-stdin
  // without this, we would only get streams once enter is pressed
  process.stdin.setRawMode(true);
  process.stdin.resume();

  render(state);
}

export const createItem = (state: State, config: Config) => {
  const name = state.prefix ? `${currentDate}-${state.text}` : state.text;
  const fullPath = join(config.stashDir, name);

  if (existsSync(fullPath)) {
    return {
      success: false,
      message: `File/directory already exists: ${name}`,
      data: {
        name,
        type: state.isFile ? "file" : "directory",
        path: fullPath,
      },
    };
  }

  if (state.isFile) {
    writeFileSync(fullPath, "", { encoding: "utf-8" });
  } else {
    mkdirSync(fullPath, { recursive: true });
  }

  const fileStats = statSync(fullPath);

  return {
    success: true,
    message: `Created ${state.isFile ? "file" : "directory"}: ${name}`,
    data: {
      name,
      type: state.isFile ? "file" : "directory",
      path: fullPath,
      mtime: fileStats.mtime,
      size: fileStats.size,
    },
  };
};

function render(state: State, error?: string) {
  clearScreen();
  const { cols } = getTerminalSize();

  writeLine(style("Create stash item", [ANSI.cyan, ANSI.bold]));
  writeLine(style("─".repeat(Math.min(cols - 4, 40)), [ANSI.dim]));
  writeLine();

  write(
    style("Name: ", [
      ANSI.bold,
      state.focusedField === 0 ? ANSI.green : ANSI.dim,
    ]),
  );
  writeLine(
    style(state.text || (state.focusedField !== 0 ? "(empty)" : ""), [
      state.focusedField === 0 ? ANSI.reset : ANSI.dim,
    ]),
  );

  writeLine();

  write(
    state.isFile
      ? style("[ ] Directory ", [ANSI.dim]) +
          style(
            "[●] File",
            state.focusedField === 1 ? [ANSI.bold, ANSI.green] : [ANSI.dim],
          )
      : style(
          "[●] Directory ",
          state.focusedField === 1 ? [ANSI.bold, ANSI.green] : [ANSI.dim],
        ) + style("[ ] File", [ANSI.dim]),
  );

  writeLine();

  writeLine(
    style(
      state.prefix ? "[●] Prefix" : "[ ] Prefix",
      state.focusedField === 2 ? [ANSI.bold, ANSI.green] : [ANSI.dim],
    ),
  );

  writeLine();

  let previewText = "...";
  if (state.text.trim() !== "") {
    previewText = state.prefix ? `${currentDate}-${state.text}` : state.text;
  }

  write("Preview: ");
  writeLine(style(`${previewText}${!state.isFile ? "/" : ""}`, [ANSI.bold]));

  writeLine();

  if (error) {
    writeLine(style(error, [ANSI.red]));
    writeLine();
  }

  writeLine(
    style(
      "⏎ create | esc cancel | tab to focus field | space to toggle fields",
      [ANSI.dim],
    ),
  );

  const cursorCol = "Name: ".length + 1;

  if (state.focusedField === 0) {
    write(ANSI.cursorShow);
    write(`\x1b[4;${cursorCol + state.cursorPosition}H`); // sets the cursor position to the end of the name field label.
  } else {
    write(ANSI.cursorHide);
  }
}
