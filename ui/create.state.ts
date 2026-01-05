import { ANSI, State } from "../types";

// Find the start of the previous word from cursor position
const findPrevWordBoundary = (text: string, pos: number): number => {
  if (pos === 0) return 0;

  let i = pos - 1;
  // Skip any spaces before cursor
  while (i > 0 && text[i] === " ") i--;
  // Move back until we hit a space or start
  while (i > 0 && text[i - 1] !== " ") i--;

  return i;
};

// Find the end of the next word from cursor position
const findNextWordBoundary = (text: string, pos: number): number => {
  if (pos >= text.length) return text.length;

  let i = pos;
  // Skip current word characters
  while (i < text.length && text[i] !== " ") i++;
  // Skip any spaces after word
  while (i < text.length && text[i] === " ") i++;

  return i;
};

export const createInitialState = (): State => ({
  text: "",
  focusedField: 0,
  isFile: false,
  prefix: false,
  cursorPosition: 0,
});

export type StateActions =
  | { type: "INPUT_CHAR"; char: string }
  | { type: "TAB" }
  | { type: "TOGGLE_TYPE" }
  | { type: "TOGGLE_PREFIX" }
  | { type: "SUBMIT" }
  | { type: "CANCEL" }
  | { type: "ARROW_LEFT" }
  | { type: "ARROW_RIGHT" }
  | { type: "ARROW_UP" }
  | { type: "ARROW_DOWN" }
  | { type: "SPACE" }
  | { type: "HOME" }
  | { type: "END" }
  | { type: "WORD_LEFT" }
  | { type: "WORD_RIGHT" }
  | { type: "BACKSPACE" };

export type ReducerResult = { done: boolean; state: State; error?: string };

export const createReducer = (
  state: State,
  action: StateActions
): ReducerResult => {
  switch (action.type) {
    case "INPUT_CHAR": {
      if (state.focusedField !== 0) {
        return { done: false, state };
      }

      return {
        done: false,
        state: {
          ...state,
          text:
            state.text.slice(0, state.cursorPosition) +
            action.char +
            state.text.slice(state.cursorPosition),
          cursorPosition: state.cursorPosition + 1,
        },
      };
    }
    case "TAB": {
      return {
        done: false,
        state: {
          ...state,
          focusedField: (state.focusedField + 1) % 3,
        },
      };
    }
    case "ARROW_LEFT": {
      if (state.focusedField === 0) {
        if (state.cursorPosition === 0) {
          return { done: false, state };
        }

        return {
          done: false,
          state: {
            ...state,
            cursorPosition: state.cursorPosition - 1,
          },
        };
      }
      if (state.focusedField === 1) {
        return {
          done: false,
          state: {
            ...state,
            isFile: !state.isFile,
          },
        };
      }

      return {
        done: false,
        state,
      };
    }
    case "ARROW_RIGHT": {
      if (state.focusedField === 0) {
        if (state.cursorPosition === state.text.length) {
          return { done: false, state };
        }

        return {
          done: false,
          state: {
            ...state,
            cursorPosition: state.cursorPosition + 1,
          },
        };
      }
      if (state.focusedField === 1) {
        return {
          done: false,
          state: {
            ...state,
            isFile: !state.isFile,
          },
        };
      }

      return {
        done: false,
        state,
      };
    }
    case "ARROW_UP": {
      return {
        done: false,
        state: {
          ...state,
          focusedField: (state.focusedField - 1 + 3) % 3,
        },
      };
    }
    case "ARROW_DOWN": {
      return {
        done: false,
        state: {
          ...state,
          focusedField: (state.focusedField + 1) % 3,
        },
      };
    }
    case "HOME": {
      if (state.focusedField !== 0) {
        return { done: false, state };
      }
      return {
        done: false,
        state: {
          ...state,
          cursorPosition: 0,
        },
      };
    }
    case "END": {
      if (state.focusedField !== 0) {
        return { done: false, state };
      }
      return {
        done: false,
        state: {
          ...state,
          cursorPosition: state.text.length,
        },
      };
    }
    case "WORD_LEFT": {
      if (state.focusedField !== 0) {
        return { done: false, state };
      }
      return {
        done: false,
        state: {
          ...state,
          cursorPosition: findPrevWordBoundary(
            state.text,
            state.cursorPosition
          ),
        },
      };
    }
    case "WORD_RIGHT": {
      if (state.focusedField !== 0) {
        return { done: false, state };
      }
      return {
        done: false,
        state: {
          ...state,
          cursorPosition: findNextWordBoundary(
            state.text,
            state.cursorPosition
          ),
        },
      };
    }
    case "BACKSPACE": {
      if (state.focusedField !== 0) {
        return { done: false, state };
      }
      if (state.cursorPosition === 0) {
        return { done: false, state };
      }
      return {
        done: false,
        state: {
          ...state,
          text:
            state.text.slice(0, state.cursorPosition - 1) +
            state.text.slice(state.cursorPosition),
          cursorPosition: state.cursorPosition - 1,
        },
      };
    }
    case "SPACE": {
      if (state.focusedField === 0) {
        return {
          done: false,
          state: {
            ...state,
            text:
              state.text.slice(0, state.cursorPosition) +
              " " +
              state.text.slice(state.cursorPosition),
            cursorPosition: state.cursorPosition + 1,
          },
        };
      }

      if (state.focusedField === 1) {
        return {
          done: false,
          state: {
            ...state,
            isFile: !state.isFile,
          },
        };
      }

      if (state.focusedField === 2) {
        return {
          done: false,
          state: {
            ...state,
            prefix: !state.prefix,
          },
        };
      }

      return { done: false, state };
    }
    case "SUBMIT": {
      // will validate here
      if (!state.text.trim().length) {
        return { done: false, state, error: "Name cannot be empty" };
      }

      return { done: true, state };
    }
    case "CANCEL": {
      return { done: true, state: createInitialState() };
    }

    default: {
      return { done: false, state };
    }
  }
};

export const keyToAction = (key: string): StateActions => {
  switch (key) {
    case ANSI.escape:
      return { type: "CANCEL" };
    case ANSI.tab:
      return { type: "TAB" };
    case ANSI.enter:
      return { type: "SUBMIT" };
    case ANSI.arrowLeft:
      return { type: "ARROW_LEFT" };
    case ANSI.arrowRight:
      return { type: "ARROW_RIGHT" };
    case ANSI.arrowUp:
      return { type: "ARROW_UP" };
    case ANSI.arrowDown:
      return { type: "ARROW_DOWN" };
    case ANSI.space:
      return { type: "SPACE" };
    case ANSI.backspace:
    case ANSI.backspaceAlt:
      return { type: "BACKSPACE" };
    // HOME key- to move cursor to beginning of line
    case ANSI.home:
    case ANSI.homeAlt:
    case ANSI.home2:
    case ANSI.cmdLeft:
    case ANSI.ctrlA:
      return { type: "HOME" };
    // END key- to move cursor to end of line
    case ANSI.end:
    case ANSI.endAlt:
    case ANSI.end2:
    case ANSI.cmdRight:
    case ANSI.ctrlE:
      return { type: "END" };
    // Option+Left (macOS) / Ctrl+Left (Windows/Linux) - move cursor by word left
    case ANSI.optionLeft:
    case ANSI.optionLeftAlt:
    case ANSI.ctrlLeft:
      return { type: "WORD_LEFT" };
    // Option+Right (macOS) / Ctrl+Right (Windows/Linux) - move cursor by word right
    case ANSI.optionRight:
    case ANSI.optionRightAlt:
    case ANSI.ctrlRight:
      return { type: "WORD_RIGHT" };
    default:
      return { type: "INPUT_CHAR", char: key };
  }
};
