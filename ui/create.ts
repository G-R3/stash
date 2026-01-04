import { State, ANSI } from "../types";
import { cleanUp, clearScreen, style, write, writeLine } from "../utils";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

/**
 * Handles rendering the create TUI.
 * Can chose between creating a file or a directory and if file/directory should
 * be prefixed with the current date.
 **/
export async function createUI() {
  const state: State = {
    text: "",
    focusedField: 0,
    isFile: false,
    prefix: true,
    cursorPosition: 0,
  };

  clearScreen();

  const handleKeyPress = async (key: string) => {
    // Escape key
    if (key === ANSI.escape) {
      cleanUp();
      clearScreen();
      process.exit(0);
    }

    if (key === ANSI.tab) {
      state.focusedField = (state.focusedField + 1) % 3;
      render(state);
      return;
    }

    // Enter key
    if (key === ANSI.enter) {
      const result = await createItem(state);

      cleanUp();
      clearScreen();

      process.stdout.write(
        style(result.message, [result.success ? ANSI.green : ANSI.red]) + "\n"
      );
      process.exit(result.success ? 0 : 1);
    } else {
      state.text += key;
      render(state);
    }
  };

  process.stdin.on("data", (data) => {
    const key = data.toString();
    handleKeyPress(key);
  });

  // without this, we would only get streams once enter is pressed
  process.stdin.setRawMode(true);
  process.stdin.resume();

  render(state);
}

const createItem = async (state: State) => {
  const fullPath = join(process.cwd(), state.text);

  if (existsSync(fullPath)) {
    return {
      success: false,
      message: "File/directory already exists",
    };
  }

  if (state.isFile) {
    writeFileSync(fullPath, "", { encoding: "utf-8" });
  } else {
    mkdirSync(fullPath, { recursive: true });
  }

  return {
    success: true,
    message: "File/directory created successfully",
  };
};

function render(state: State) {
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
    style(state.isFile ? "[○] Directory [●] File" : "[○] File [●] Directory", [
      ANSI.bold,
      state.focusedField === 1 ? ANSI.green : ANSI.dim,
    ])
  );

  writeLine();

  writeLine(
    style(state.prefix ? "[●] Prefix" : "[○] No Prefix", [
      ANSI.bold,
      state.focusedField === 2 ? ANSI.green : ANSI.dim,
    ])
  );

  writeLine();

  const previewText = state.prefix
    ? `${new Date().toISOString().split("T")[0]}-${state.text}`
    : state.text;

  write(style("Preview: ", [ANSI.bold, ANSI.green]));
  writeLine(style(`${previewText}${!state.isFile ? "/" : ""}`, [ANSI.reset]));

  writeLine();
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
