import { ANSI, Config, StashItem } from "../types";
import {
  clearScreen,
  getStashItems,
  getTerminalSize,
  isDirectory,
  padEnd,
  relativeTime,
  style,
  writeLine,
} from "../utils";

export function searchUI(config: Config, command?: string) {
  clearScreen();
  const items = getStashItems(config);

  render(items as StashItem[]);
}

function render(items: StashItem[]) {
  const { cols } = getTerminalSize();

  writeLine(style("Search stash items", [ANSI.cyan, ANSI.bold]));
  writeLine(style("─".repeat(Math.min(cols - 4, 45)), [ANSI.dim]));
  writeLine();

  items.forEach((item) => {
    const suffix = isDirectory(item.path) ? `/` : "";
    const paddedName = padEnd(item.name + suffix, Math.min(cols - 4, 30));

    const time = relativeTime(item.mtime);

    writeLine(paddedName + style(`      (${time})`, [ANSI.dim]));
  });
}
