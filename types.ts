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

export const ANSI = {
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  inverse: "\x1b[7m",

  cursorHome: "\x1b[H", // shorthand for \x1b[0;0H. We omit 0;0 and default to 1;1 cursor row;col terminal position
  cursorHide: "\x1b[?25l",
  cursorShow: "\x1b[?25h",
  clearScreen: "\x1b[2J",
};
