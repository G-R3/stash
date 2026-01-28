type TextFieldState = {
  text: string;
  cursorPosition: number;
};

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

export const insertChar = (
  state: TextFieldState,
  char: string,
): TextFieldState => {
  const newCursorPosition = state.cursorPosition + char.length;

  return {
    text:
      state.text.slice(0, state.cursorPosition) +
      char +
      state.text.slice(state.cursorPosition),
    cursorPosition: newCursorPosition,
  };
};

export const moveLeft = (state: TextFieldState): TextFieldState => {
  return {
    ...state,
    cursorPosition: state.cursorPosition - 1,
  };
};

export const moveRight = (state: TextFieldState): TextFieldState => {
  const newCursorPosition = state.cursorPosition + 1;

  return {
    ...state,
    cursorPosition: state.cursorPosition + 1,
  };
};

export const moveToStart = (state: TextFieldState): TextFieldState => {
  return {
    ...state,
    cursorPosition: 0,
  };
};

export const moveToEnd = (state: TextFieldState): TextFieldState => {
  return {
    ...state,
    cursorPosition: state.text.length,
  };
};

export const moveWordLeft = (state: TextFieldState): TextFieldState => {
  const cursorPosition = findPrevWordBoundary(state.text, state.cursorPosition);

  return {
    ...state,
    cursorPosition,
  };
};

export const moveWordRight = (state: TextFieldState): TextFieldState => {
  const cursorPosition = findNextWordBoundary(state.text, state.cursorPosition);

  return {
    ...state,
    cursorPosition,
  };
};

export const deleteBack = (state: TextFieldState): TextFieldState => {
  if (state.cursorPosition === 0) return state;

  return {
    ...state,
    text:
      state.text.slice(0, state.cursorPosition - 1) +
      state.text.slice(state.cursorPosition),
    cursorPosition: state.cursorPosition - 1,
  };
};
