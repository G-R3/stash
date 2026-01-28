import { ANSI, type State } from "../types";
import {
  deleteBack,
  insertChar,
  moveLeft,
  moveRight,
  moveToEnd,
  moveToStart,
  moveWordLeft,
  moveWordRight,
} from "./text-field";

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
  action: StateActions,
): ReducerResult => {
  switch (action.type) {
    case "INPUT_CHAR": {
      if (state.focusedField !== 0) {
        return { done: false, state };
      }

      const { text, cursorPosition } = insertChar(
        { text: state.text, cursorPosition: state.cursorPosition },
        action.char,
      );

      return {
        done: false,
        state: {
          ...state,
          text,
          cursorPosition,
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

        const { cursorPosition } = moveLeft({
          text: state.text,
          cursorPosition: state.cursorPosition,
        });

        return {
          done: false,
          state: {
            ...state,
            cursorPosition,
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

        const { cursorPosition } = moveRight({
          text: state.text,
          cursorPosition: state.cursorPosition,
        });

        return {
          done: false,
          state: {
            ...state,
            cursorPosition,
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

      const { cursorPosition } = moveToStart({
        text: state.text,
        cursorPosition: state.cursorPosition,
      });

      return {
        done: false,
        state: {
          ...state,
          cursorPosition,
        },
      };
    }
    case "END": {
      if (state.focusedField !== 0) {
        return { done: false, state };
      }

      const { cursorPosition } = moveToEnd({
        text: state.text,
        cursorPosition: state.cursorPosition,
      });

      return {
        done: false,
        state: {
          ...state,
          cursorPosition,
        },
      };
    }
    case "WORD_LEFT": {
      if (state.focusedField !== 0) {
        return { done: false, state };
      }

      const { cursorPosition } = moveWordLeft({
        text: state.text,
        cursorPosition: state.cursorPosition,
      });

      return {
        done: false,
        state: {
          ...state,
          cursorPosition,
        },
      };
    }
    case "WORD_RIGHT": {
      if (state.focusedField !== 0) {
        return { done: false, state };
      }

      const { cursorPosition } = moveWordRight({
        text: state.text,
        cursorPosition: state.cursorPosition,
      });

      return {
        done: false,
        state: {
          ...state,
          cursorPosition,
        },
      };
    }
    case "BACKSPACE": {
      if (state.focusedField !== 0) {
        return { done: false, state };
      }

      const { text, cursorPosition } = deleteBack({
        text: state.text,
        cursorPosition: state.cursorPosition,
      });

      return {
        done: false,
        state: {
          ...state,
          text,
          cursorPosition,
        },
      };
    }
    case "SPACE": {
      if (state.focusedField === 0) {
        const { text, cursorPosition } = insertChar(
          { text: state.text, cursorPosition: state.cursorPosition },
          " ",
        );

        return {
          done: false,
          state: {
            ...state,
            text,
            cursorPosition,
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
