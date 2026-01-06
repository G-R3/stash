import { ANSI, Config, StashItem } from "../types";
import {
  cleanUp,
  clearScreen,
  getStashItems,
  getTerminalSize,
  isDirectory,
  padEnd,
  relativeTime,
  style,
  writeLine,
} from "../utils";

type State = {
  selectedIndex: number;
};

const iconMap = {
  directory: "📁",
  file: "📄",
};

export function searchUI(config: Config, command?: string) {
  clearScreen();
  const items = getStashItems(config);

  const state: State = {
    selectedIndex: 0,
  };

  process.stdin.on("data", (data) => {
    const key = data.toString();

    if (key === ANSI.escape) {
      clearScreen();
      cleanUp();
      process.exit(0);
    }

    if (key === ANSI.arrowUp) {
      state.selectedIndex = Math.max(0, state.selectedIndex - 1);
    }

    if (key === ANSI.arrowDown) {
      state.selectedIndex = Math.min(items.length - 1, state.selectedIndex + 1);
    }

    if (key === ANSI.tab) {
      state.selectedIndex = (state.selectedIndex + 1) % items.length;
    }

    render(state, items as StashItem[]);
  });

  process.stdin.setRawMode(true);
  process.stdin.resume();

  render(state, items as StashItem[]);
}

function render(state: State, items: StashItem[]) {
  clearScreen();
  const { cols } = getTerminalSize();

  writeLine(style("Search stash items", [ANSI.cyan, ANSI.bold]));
  writeLine(style("─".repeat(Math.min(cols - 4, 45)), [ANSI.dim]));
  writeLine();

  items.forEach((item, index) => {
    const suffix = isDirectory(item.path) ? `/` : "";
    const paddedName = padEnd(
      iconMap[item.type] + " " + item.name + suffix,
      Math.min(cols - 4, 30)
    );

    const time = relativeTime(item.mtime);
    const isSelected = state.selectedIndex === index;

    const line = paddedName + style(`      (${time})`, [ANSI.dim]);

    writeLine(isSelected ? style(line, [ANSI.inverse]) : line);
  });
}
