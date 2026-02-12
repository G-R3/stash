import { existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { ANSI, Commands, type Config, type StashItem } from "./types";

export function style(text: string, styles: string[]): string {
  if (styles.length === 0) {
    return text;
  }
  return `${styles.join("")}${text}${ANSI.reset}`;
}

export function clearScreen(): void {
  process.stdout.write(ANSI.clearScreen);
  process.stdout.write(ANSI.cursorHome);
  process.stdout.write(ANSI.cursorHide);
}

export function cleanUp(): void {
  process.stdin.setRawMode(false);
  process.stdin.removeAllListeners("data");
  process.stdin.pause();
  process.stdout.write(ANSI.cursorShow);
}

export function showHelpMessage(command: string): void {
  switch (command) {
    case Commands.CREATE:
      console.log(`
            Usage: stash create
            
            Open interactive TUI to create a new file/directory

            Flags:
            -h, --help  Show help message and exit
    `);
      break;
    default:
      console.log(`
                Usage: stash [command] [query]
    
                Run an interactive TUI to browse, search, and manage stashed files/directories.
    
                Commands:
                  create          Open interactive TUI to create a new file/directory
                
                Arguments:
                  [query]         Open interactive TUI with this query as the initial search
                
                Options:
                  -h, --help      Display this message and exit
                
                Examples:
                  stash           Browse and search all items
                  stash notes     Browse and search with "notes" as the initial search
                  stash create    Create a new file or directory
            `);
      break;
  }
}

export function writeLine(text: string = ""): void {
  process.stdout.write(text + "\n");
}

export function write(text: string): void {
  process.stdout.write(text);
}

export const currentDate = new Date().toISOString().split("T")[0];

export function getStashDir(config: Config) {
  if (!existsSync(config.stashDir)) {
    console.log(
      `Stash directory ${config.stashDir} does not exist, creating...`,
    );
    mkdirSync(config.stashDir, { recursive: true });
  }

  return config.stashDir;
}

export function isStashEmpty(config: Config) {
  const stash = getStashItems(config);

  return stash.length === 0;
}

export function getTerminalSize() {
  return {
    rows: process.stdout.rows || process.stderr.rows || 24,
    cols: process.stdout.columns || process.stderr.columns || 80,
  };
}

export function getStashItems(config: Config): StashItem[] {
  const stashPath = getStashDir(config);

  const entries = readdirSync(stashPath);

  const items: Array<StashItem> = [];

  for (const entry of entries) {
    const fullPath = join(stashPath, entry);
    const stats = statSync(fullPath);

    items.push({
      name: entry,
      type: stats.isFile() ? "file" : "directory",
      path: fullPath,
      mtime: stats.mtime,
      size: stats.size,
      score: 0,
      matchedIndices: [],
    });
  }

  return items.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
}

export function isDirectory(path: string) {
  return statSync(path).isDirectory();
}

export function padEnd(
  str: string,
  length: number,
  char: string = " ",
): string {
  if (str.length >= length) {
    return str;
  }
  return str + char.repeat(length - str.length);
}

export function relativeTime(date: Date) {
  const diff = Date.now() - date.getTime();

  const units: [number, string][] = [
    [31536000000, "y"],
    [2592000000, "mo"],
    [86400000, "d"],
    [3600000, "h"],
    [60000, "m"],
    [1000, "s"],
  ];

  for (const [ms, unit] of units) {
    if (diff >= ms) {
      return `${Math.floor(diff / ms)}${unit} ago`;
    }
  }

  return "just now";
}
