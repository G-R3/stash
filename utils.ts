import { existsSync, mkdirSync } from "fs";
import { Commands, ANSI, Config } from "./types";

export function style(text: string, styles: string[]): string {
  if (styles.length === 0) {
    return text;
  }
  return `${styles.join("")}${text}${ANSI.reset}`;
}

export function clearScreen(): void {
  process.stdout.write(ANSI.clearScreen);
  process.stdout.write(ANSI.cursorHome);
  process.stdout.write(ANSI.cursorShow);
}

export function cleanUp(): void {
  process.stdin.setRawMode(false);
  process.stdin.removeAllListeners("data");
  process.stdin.pause();
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
      `Stash directory ${config.stashDir} does not exist, creating...`
    );
    mkdirSync(config.stashDir, { recursive: true });
  }

  return config.stashDir;
}

export function getTerminalSize() {
  return {
    rows: process.stdout.rows || process.stderr.rows || 24,
    cols: process.stdout.columns || process.stderr.columns || 80,
  };
}
