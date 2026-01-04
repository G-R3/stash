import { State, ANSI } from "../types";
import { cleanUp, clearScreen, style, write, writeLine } from "../utils";
import { existsSync, mkdirSync, statSync, writeFileSync } from "fs";
import { join } from "path";
import { createInitialState, createReducer, keyToAction } from "./create.state";

/**
 * Handles rendering the create TUI.
 * Can chose between creating a file or a directory and if file/directory should
 * be prefixed with the current date.
 **/
export async function createUI() {
  let state = createInitialState();

  clearScreen();

  process.stdin.on("data", (data) => {
    const key = data.toString();
    const action = keyToAction(key);

    if (!action) return;

    const result = createReducer(state, action);

    if (result.done) {
      cleanUp();
      clearScreen();

      if (action.type === "SUBMIT") {
        const createResult = createItem(state);

        writeLine(
          style(createResult.message, [
            createResult.success ? ANSI.green : ANSI.red,
          ])
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

  // without this, we would only get streams once enter is pressed
  process.stdin.setRawMode(true);
  process.stdin.resume();

  render(state);
}

export const createItem = (state: State) => {
  // TODO: ensure item name is prefixed with Date if prefix is true
  const fullPath = join(process.cwd(), state.text);

  if (existsSync(fullPath)) {
    return {
      success: false,
      message: `File/directory already exists: ${state.text}`,
      data: {
        name: state.text,
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
    message: `Created ${state.isFile ? "file" : "directory"}: ${state.text}`,
    data: {
      name: state.text,
      type: state.isFile ? "file" : "directory",
      path: fullPath,
      mtime: fileStats.mtime,
      size: fileStats.size,
    },
  };
};

function render(state: State, error?: string) {
  clearScreen();

  writeLine("Creating a new file/directory");
  writeLine();

  write(
    style("Name: ", [
      ANSI.bold,
      state.focusedField === 0 ? ANSI.green : ANSI.dim,
    ])
  );
  writeLine(
    style(state.text || (state.focusedField !== 0 ? "(empty)" : ""), [
      state.focusedField === 0 ? ANSI.reset : ANSI.dim,
    ])
  );

  writeLine();

  write(
    state.isFile
      ? style("[ ] Directory ", [ANSI.dim]) +
          style(
            "[●] File",
            state.focusedField === 1 ? [ANSI.bold, ANSI.green] : [ANSI.dim]
          )
      : style(
          "[●] Directory ",
          state.focusedField === 1 ? [ANSI.bold, ANSI.green] : [ANSI.dim]
        ) + style("[ ] File", [ANSI.dim])
  );

  writeLine();

  writeLine(
    style(
      state.prefix ? "[●] Prefix" : "[ ] Prefix",
      state.focusedField === 2 ? [ANSI.bold, ANSI.green] : [ANSI.dim]
    )
  );

  writeLine();

  let previewText = "...";
  if (state.text.trim() !== "") {
    previewText = state.prefix
      ? `${new Date().toISOString().split("T")[0]}-${state.text}`
      : state.text;
  }

  write(style("Preview: ", [ANSI.bold, ANSI.green]));
  writeLine(style(`${previewText}${!state.isFile ? "/" : ""}`, [ANSI.reset]));

  writeLine();

  if (error) {
    writeLine(style(error, [ANSI.red]));
    writeLine();
  }

  writeLine(
    style("Enter to create | Escape to cancel | Tab to focus next field", [
      ANSI.dim,
    ])
  );

  const cursorCol = "Name: ".length + state.text.length + 1;

  if (state.focusedField === 0) {
    write(ANSI.cursorShow);
    write(`\x1b[3;${cursorCol}H`); // sets the cursor position to the end of the name field label.
  } else {
    write(ANSI.cursorHide);
  }
}
