import { rmSync } from "fs";
import { ANSI, type Config, type SearchState } from "../types";
import { getStashItems } from "../utils";
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

const filterItems = (query: string, config: Config) =>
  getStashItems(config).filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()),
  );

const updateQueryAndItems = (
  state: SearchState,
  newQuery: string,
  newCursorPosition: number,
  config: Config,
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
  | { type: "BACKSPACE" }
  | { type: "DELETE_ITEM" };

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
  action: StateActions,
  config: Config,
): ReducerResult => {
  switch (action.type) {
    case "INPUT_CHAR": {
      const { text, cursorPosition } = insertChar(
        { text: state.query, cursorPosition: state.cursorPosition },
        action.char,
      );

      return updateQueryAndItems(state, text, cursorPosition, config);
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

      const { cursorPosition } = moveLeft({
        text: state.query,
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
    case "ARROW_RIGHT": {
      if (state.cursorPosition === state.query.length) {
        return { done: false, state };
      }

      const { cursorPosition } = moveRight({
        text: state.query,
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
            state.selectedIndex + 1,
          ),
        },
      };
    }
    case "HOME": {
      const { cursorPosition } = moveToStart({
        text: state.query,
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
      const { cursorPosition } = moveToEnd({
        text: state.query,
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
      const { cursorPosition } = moveWordLeft({
        text: state.query,
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
      const { cursorPosition } = moveWordRight({
        text: state.query,
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
      if (state.cursorPosition === 0) {
        return {
          done: false,
          state: { ...state, items: getStashItems(config) },
        };
      }

      const { text, cursorPosition } = deleteBack({
        text: state.query,
        cursorPosition: state.cursorPosition,
      });

      return updateQueryAndItems(state, text, cursorPosition, config);
    }
    case "SPACE": {
      const { text, cursorPosition } = insertChar(
        { text: state.query, cursorPosition: state.cursorPosition },
        " ",
      );

      return updateQueryAndItems(state, text, cursorPosition, config);
    }
    case "DELETE_ITEM": {
      const itemToDelete = state.items[state.selectedIndex];

      if (!itemToDelete) {
        return {
          done: false,
          state,
        };
      }

      rmSync(itemToDelete.path, { recursive: true });

      return {
        done: false,
        state: {
          ...state,
          items: state.items.filter((item) => item.path !== itemToDelete.path),
        },
      };
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
    case ANSI.ctrlD:
      return { type: "DELETE_ITEM" };
    default:
      return { type: "INPUT_CHAR", char: key };
  }
};
