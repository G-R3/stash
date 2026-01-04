import { ANSI, State } from "../types";

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
  | { type: "SPACE" };

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
          text: state.text + action.char,
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
        // TODO: move cursor left on name field
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
        // TODO: move cursor right on name field
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
    case "SPACE": {
      if (state.focusedField === 0) {
        return { done: false, state: { ...state, text: state.text + " " } };
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
    default:
      return { type: "INPUT_CHAR", char: key };
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
  }
};
