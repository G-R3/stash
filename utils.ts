import { statSync } from "node:fs";
import { ANSI, Commands } from "./types";

export function style(
  text: string,
  styles: string[],
  restoreStyles: string[] = [],
): string {
  if (styles.length === 0) {
    return text;
  }
  return `${styles.join("")}${text}${ANSI.reset}${restoreStyles.join("")}`;
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
  process.stdout.write(`${text}\n`);
}

export function write(text: string): void {
  process.stdout.write(text);
}

export function getTerminalSize() {
  return {
    rows: process.stdout.rows || process.stderr.rows || 24,
    cols: process.stdout.columns || process.stderr.columns || 80,
  };
}

export function isDirectory(path: string) {
  return statSync(path).isDirectory();
}

/** Match ANSI CSI sequences (e.g. ESC[36m, ESC[0m) so we can measure the visible length. */
const ESC = "\u001B";
const ANSI_CSI_RE = new RegExp(`${ESC}\\[[0-9;]*[a-zA-Z]`, "g");

export function visibleLength(str: string): number {
  return str.replace(ANSI_CSI_RE, "").length;
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

/** Pads string so its visible (display) length is at least `length`. We can  use this for strings that may contain ANSI codes :) */
export function padEndVisible(
  str: string,
  length: number,
  char: string = " ",
): string {
  const visible = visibleLength(str);
  if (visible >= length) {
    return str;
  }
  return str + char.repeat(length - visible);
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
