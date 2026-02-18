import { ANSI, type Config, type SearchState } from "../types";
import {
  cleanUp,
  clearScreen,
  getTerminalSize,
  isDirectory,
  padEnd,
  relativeTime,
  style,
  write,
  writeLine,
} from "../utils";
import { createUI } from "./create";
import { highlightMatchedIndices } from "./fuzzy";
import { createInitialState, createReducer, keyToAction } from "./search.state";

const iconMap = {
  directory: "📁",
  file: "📄",
};

export function searchUI(config: Config, arg?: string) {
  clearScreen();

  let state = createInitialState(config, arg);

  process.stdin.on("data", (data) => {
    const key = data.toString();

    const action = keyToAction(key);

    if (!action) return;

    const result = createReducer(state, action, config);

    if (result.done) {
      clearScreen();
      cleanUp();

      if (result.createNew) {
        createUI(config, result.state.query);
        return;
      }

      process.exit(0);
    }

    state = result.state;

    render(result.state);
  });

  process.stdin.setRawMode(true);
  process.stdin.resume();

  render(state);
}

function render(state: SearchState) {
  clearScreen();
  const { cols } = getTerminalSize();

  const { items } = state;

  writeLine(style("Search stash items", [ANSI.cyan, ANSI.bold]));
  writeLine(style("─".repeat(Math.min(cols - 4, 45)), [ANSI.dim]));
  writeLine();

  write(style("Search: ", [ANSI.dim]));
  writeLine(state.query);

  writeLine();

  items.forEach((item, index) => {
    const suffix = isDirectory(item.path) ? `/` : "";
    const paddedName = padEnd(
      iconMap[item.type] +
        " " +
        highlightMatchedIndices(item, item.matchedIndices) +
        suffix,
      Math.min(cols - 4, 30),
    );

    const time = relativeTime(item.mtime);
    const isSelected = state.selectedIndex === index;

    const line = paddedName + style(`      (${time})`, [ANSI.dim]);

    writeLine(isSelected ? style(line, [ANSI.inverse]) : line);
  });

  writeLine();

  const createLabel = state.query
    ? `+ create new "${state.query}"`
    : "+ create new item";
  const isCreateSelected = state.selectedIndex === items.length;
  writeLine(
    isCreateSelected
      ? style(createLabel, [ANSI.inverse])
      : style(createLabel, [ANSI.dim]),
  );

  writeLine();
  writeLine(style("esc to cancel | ctrl+d to delete item", [ANSI.dim]));

  const cursorCol = "Search: ".length + 1;

  write(ANSI.cursorShow);
  write(`\x1b[4;${cursorCol + state.cursorPosition}H`); // sets the cursor position to the end of the search field label.
}
