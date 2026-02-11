export enum Commands {
  CREATE = "create",
}

export type State = {
  text: string;
  focusedField: number;
  isFile: boolean;
  prefix: boolean;
  cursorPosition: number;
};

export type SearchState = {
  selectedIndex: number;
  query: string;
  cursorPosition: number;
  items: StashItem[];
};

export type StashItem = {
  name: string;
  type: "file" | "directory";
  path: string;
  mtime: Date;
  size: number;
  matchedIndices: Array<number>;
  score: number;
};

export const ANSI = {
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  inverse: "\x1b[7m",

  cursorHome: "\x1b[H", // shorthand for \x1b[0;0H. We omit 0;0 and default to 1;1 cursor row;col terminal position
  cursorHide: "\x1b[?25l",
  cursorShow: "\x1b[?25h",
  clearScreen: "\x1b[2J",

  // keys
  escape: "\x1b",
  enter: "\r",
  tab: "\t",
  backspace: "\x7f",
  backspaceAlt: "\x08",
  arrowDown: "\x1b[B",
  arrowUp: "\x1b[A",
  arrowLeft: "\x1b[D",
  arrowRight: "\x1b[C",
  space: " ",

  // Home and End keys to move cursor to beginning and end of line
  home: "\x1b[H", // same code as cursorHome but different purpose depending on context
  homeAlt: "\x1bOH",
  home2: "\x1b[1~",
  end: "\x1b[F",
  endAlt: "\x1bOF",
  end2: "\x1b[4~",

  // Option + arrow keys to move cursor by word left and right
  optionLeft: "\x1bb",
  optionRight: "\x1bf",
  optionLeftAlt: "\x1b[1;3D",
  optionRightAlt: "\x1b[1;3C",

  // Cmd + arrow keys to move cursor by line left and right
  cmdLeft: "\x1b[1;9D",
  cmdRight: "\x1b[1;9C",
  // Ctrl+A / Ctrl+E (readline style, sent by macOS Terminal for Cmd+arrows)
  ctrlA: "\x01",
  ctrlE: "\x05",

  // Ctrl + D
  ctrlD: "\x04",

  // Ctrl + arrow keys to move cursor by word left and right on Windows/Linux
  ctrlLeft: "\x1b[1;5D",
  ctrlRight: "\x1b[1;5C",
};

export type Config = {
  stashDir: string;
};
