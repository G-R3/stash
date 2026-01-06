import { config } from "../config";
import { ANSI, Config, SearchState } from "../types";
import { getStashItems } from "../utils";

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

const filterItems = (query: string, config: Config) =>
  getStashItems(config).filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );

const updateQueryAndItems = (
  state: SearchState,
  newQuery: string,
  newCursorPosition: number
): ReducerResult => {
  return {
    done: false,
    state: {
      ...state,
      query: newQuery,
      cursorPosition: newCursorPosition,
      items: filterItems(newQuery, config),
      selectedIndex: 0,
    },
  };
};

export type StateActions =
  | { type: "INPUT_CHAR"; char: string }
  | { type: "TAB" }
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

export type ReducerResult = {
  done: boolean;
  state: SearchState;
  error?: string;
};

export const createInitialState = (config: Config): SearchState => ({
  query: "",
  cursorPosition: 0,
  selectedIndex: 0,
  items: getStashItems(config),
});

export const createReducer = (
  state: SearchState,
  action: StateActions
): ReducerResult => {
  switch (action.type) {
    case "INPUT_CHAR": {
      const newQuery =
        state.query.slice(0, state.cursorPosition) +
        action.char +
        state.query.slice(state.cursorPosition);

      return updateQueryAndItems(state, newQuery, state.cursorPosition + 1);
    }
    case "TAB": {
      return {
        done: false,
        state: {
          ...state,
          selectedIndex: (state.selectedIndex + 1) % state.items.length,
        },
      };
    }
    case "ARROW_LEFT": {
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
    case "ARROW_RIGHT": {
      if (state.cursorPosition === state.query.length) {
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
    case "ARROW_UP": {
      return {
        done: false,
        state: {
          ...state,
          selectedIndex: Math.max(0, state.selectedIndex - 1),
        },
      };
    }
    case "ARROW_DOWN": {
      return {
        done: false,
        state: {
          ...state,
          selectedIndex: Math.min(
            state.items.length - 1,
            state.selectedIndex + 1
          ),
        },
      };
    }
    case "HOME": {
      return {
        done: false,
        state: {
          ...state,
          cursorPosition: 0,
        },
      };
    }
    case "END": {
      return {
        done: false,
        state: {
          ...state,
          cursorPosition: state.query.length,
        },
      };
    }
    case "WORD_LEFT": {
      return {
        done: false,
        state: {
          ...state,
          cursorPosition: findPrevWordBoundary(
            state.query,
            state.cursorPosition
          ),
        },
      };
    }
    case "WORD_RIGHT": {
      return {
        done: false,
        state: {
          ...state,
          cursorPosition: findNextWordBoundary(
            state.query,
            state.cursorPosition
          ),
        },
      };
    }
    case "BACKSPACE": {
      if (state.cursorPosition === 0) {
        return {
          done: false,
          state: { ...state, items: getStashItems(config) },
        };
      }

      const newQuery =
        state.query.slice(0, state.cursorPosition - 1) +
        state.query.slice(state.cursorPosition);

      return updateQueryAndItems(state, newQuery, state.cursorPosition - 1);
    }
    case "SPACE": {
      const newQuery =
        state.query.slice(0, state.cursorPosition) +
        " " +
        state.query.slice(state.cursorPosition);

      return updateQueryAndItems(state, newQuery, state.cursorPosition + 1);
    }

    case "CANCEL": {
      return { done: true, state: createInitialState(config) };
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
