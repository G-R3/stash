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

export const state: State = {
  text: "",
  focusedField: 0,
  isFile: false,
  prefix: true,
  cursorPosition: 0,
};

export const Styles = {
  bold: "\x1b[1m",
  green: "\x1b[32m",

  reset: "\x1b[0m",
};
