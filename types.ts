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

export const Styles = {
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  reset: "\x1b[0m",
};
