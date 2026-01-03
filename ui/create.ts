import { State, state, Styles } from "../types";
import { cleanUp, clearScreen, style } from "../utils";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

/**
 * Handles rendering the create TUI.
 * Can chose between creating a file or a directory and if file/directory should
 * be prefixed with the current date.
 **/
export async function create() {
  clearScreen();
  console.log("Creating a new file/directory");

  process.stdout.write(style("Name: ", [Styles.bold, Styles.green]));

  const handleKeyPress = async (key: string) => {
    if (key === "\x1b") {
      cleanUp();
      clearScreen();
      process.exit(0);
    }

    if (key === "\r") {
      console.log("Current State: ", state);
      await createItem(state);

      cleanUp();
      clearScreen();
      process.exit(0);
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
  console.log("Creating item: ", state);
  if (existsSync(join(process.cwd(), state.text))) {
    console.log("File/directory already exists");
    return;
  }
  if (state.isFile) {
    writeFileSync(state.text, "");
  } else {
    mkdirSync(state.text);
  }

  return { success: true, message: "Item created successfully" };
};
