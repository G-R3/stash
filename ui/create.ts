import { State, Styles } from "../types";
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

  process.stdout.write("Creating a new file/directory");
  process.stdout.write("\n");
  process.stdout.write(style("Name: ", [Styles.bold, Styles.green]));

  const handleKeyPress = async (key: string) => {
    if (key === "\x1b") {
      cleanUp();
      clearScreen();
      process.exit(0);
    }

    if (key === "\r") {
      const result = await createItem(state);

      cleanUp();
      clearScreen();

      process.stdout.write(style(result.message, [Styles.red]) + "\n");
      process.exit(result.success ? 0 : 1);
    } else {
      state.text += key;
      process.stdout.write(key);
    }
  };

  process.stdin.on("data", (data) => {
    const key = data.toString();
    handleKeyPress(key);
  });

  // without this, we would only get streams once enter is pressed
  process.stdin.setRawMode(true);
  process.stdin.resume();
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
