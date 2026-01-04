import { State, ANSI } from "../types";
import { cleanUp, clearScreen, style } from "../utils";
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
    if (key === "\x1b") {
      cleanUp();
      clearScreen();
      process.exit(0);
    }

    // Enter key
    if (key === "\r") {
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

  process.stdout.write("Creating a new file/directory" + "\n");
  process.stdout.write("\n");

  process.stdout.write(style("Name: ", [ANSI.bold, ANSI.green]));
  process.stdout.write(style(state.text, [ANSI.reset]));
  process.stdout.write("\n");

  if (state.isFile) {
    process.stdout.write(
      style("[○] Directory [●] File", [ANSI.bold, ANSI.green])
    );
    process.stdout.write("\n");
  } else {
    process.stdout.write(
      style("[○] File [●] Directory", [ANSI.bold, ANSI.green])
    );
    process.stdout.write("\n");
  }

  if (state.prefix) {
    process.stdout.write(style("[●] Prefix", [ANSI.bold, ANSI.green]));
  } else {
    process.stdout.write(style("[○] No Prefix", [ANSI.bold, ANSI.red]));
  }

  const previewText = state.prefix
    ? `${new Date().toISOString().split("T")[0]}-${state.text}`
    : state.text;

  process.stdout.write(style("Preview: ", [ANSI.bold, ANSI.green]));
  process.stdout.write(
    style(previewText + (!state.isFile ? "/" : ""), [ANSI.reset])
  );
  process.stdout.write("\n");

  process.stdout.write(
    style("\n" + "Enter to create | Escape to cancel", [ANSI.dim])
  );

  const cursorCol = "Name: ".length + state.text.length + 1;
  process.stdout.write(`\x1b[3;${cursorCol}H`);
}
