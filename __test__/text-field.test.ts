import { describe, expect, test } from "bun:test";
import {
  deleteBack,
  insertChar,
  moveLeft,
  moveRight,
  moveToEnd,
  moveToStart,
  moveWordLeft,
  moveWordRight,
} from "../ui/text-field";

describe("text-field", () => {
  describe("insertChar", () => {
    test("should insert character at cursor position", () => {
      const state = { text: "hllo", cursorPosition: 1 };
      const result = insertChar(state, "e");

      expect(result.text).toBe("hello");
      expect(result.cursorPosition).toBe(2);
    });

    test("should insert at beginning when cursor is at position 0", () => {
      const state = { text: "ello", cursorPosition: 0 };
      const result = insertChar(state, "h");

      expect(result.text).toBe("hello");
      expect(result.cursorPosition).toBe(1);
    });

    test("should insert at end when cursor is at text length", () => {
      const state = { text: "hell", cursorPosition: 4 };
      const result = insertChar(state, "o");

      expect(result.text).toBe("hello");
      expect(result.cursorPosition).toBe(5);
    });

    test("should insert space at cursor position", () => {
      const state = { text: "helloworld", cursorPosition: 5 };
      const result = insertChar(state, " ");

      expect(result.text).toBe("hello world");
      expect(result.cursorPosition).toBe(6);
    });

    test("should handle multi-character insert", () => {
      const state = { text: "hd", cursorPosition: 1 };
      const result = insertChar(state, "ello worl");

      expect(result.text).toBe("hello world");
      expect(result.cursorPosition).toBe(10);
    });
  });

  describe("moveLeft", () => {
    test("should move cursor left by one", () => {
      const state = { text: "hello", cursorPosition: 3 };
      const result = moveLeft(state);

      expect(result.cursorPosition).toBe(2);
    });

    test("should preserve text when moving", () => {
      const state = { text: "hello", cursorPosition: 3 };
      const result = moveLeft(state);

      expect(result.text).toBe("hello");
    });
  });

  describe("moveRight", () => {
    test("should move cursor right by one", () => {
      const state = { text: "hello", cursorPosition: 2 };
      const result = moveRight(state);

      expect(result.cursorPosition).toBe(3);
    });

    test("should preserve text when moving", () => {
      const state = { text: "hello", cursorPosition: 2 };
      const result = moveRight(state);

      expect(result.text).toBe("hello");
    });
  });

  describe("moveToStart", () => {
    test("should move cursor to position 0", () => {
      const state = { text: "hello world", cursorPosition: 6 };
      const result = moveToStart(state);

      expect(result.cursorPosition).toBe(0);
    });

    test("should preserve text when moving", () => {
      const state = { text: "hello world", cursorPosition: 6 };
      const result = moveToStart(state);

      expect(result.text).toBe("hello world");
    });
  });

  describe("moveToEnd", () => {
    test("should move cursor to end of text", () => {
      const state = { text: "hello world", cursorPosition: 0 };
      const result = moveToEnd(state);

      expect(result.cursorPosition).toBe(11);
    });

    test("should preserve text when moving", () => {
      const state = { text: "hello world", cursorPosition: 0 };
      const result = moveToEnd(state);

      expect(result.text).toBe("hello world");
    });
  });

  describe("moveWordLeft", () => {
    test("should move cursor to previous word boundary", () => {
      const state = { text: "hello world test", cursorPosition: 16 };

      const result1 = moveWordLeft(state);
      expect(result1.cursorPosition).toBe(12); // start of "test"

      const result2 = moveWordLeft(result1);
      expect(result2.cursorPosition).toBe(6); // start of "world"

      const result3 = moveWordLeft(result2);
      expect(result3.cursorPosition).toBe(0); // start of "hello"
    });

    test("should handle cursor in middle of word", () => {
      const state = { text: "hello world", cursorPosition: 8 };
      const result = moveWordLeft(state);

      expect(result.cursorPosition).toBe(6); // start of "world"
    });

    test("should stay at 0 when already at start", () => {
      const state = { text: "hello", cursorPosition: 0 };
      const result = moveWordLeft(state);

      expect(result.cursorPosition).toBe(0);
    });
  });

  describe("moveWordRight", () => {
    test("should move cursor to next word boundary", () => {
      const state = { text: "hello world test", cursorPosition: 0 };

      const result1 = moveWordRight(state);
      expect(result1.cursorPosition).toBe(6); // start of "world"

      const result2 = moveWordRight(result1);
      expect(result2.cursorPosition).toBe(12); // start of "test"

      const result3 = moveWordRight(result2);
      expect(result3.cursorPosition).toBe(16); // end of text
    });

    test("should handle cursor in middle of word", () => {
      const state = { text: "hello world", cursorPosition: 2 };
      const result = moveWordRight(state);

      expect(result.cursorPosition).toBe(6); // start of "world"
    });

    test("should stay at end when already at end", () => {
      const state = { text: "hello", cursorPosition: 5 };
      const result = moveWordRight(state);

      expect(result.cursorPosition).toBe(5);
    });
  });

  describe("deleteBack", () => {
    test("should delete character before cursor position", () => {
      const state = { text: "hello world", cursorPosition: 6 };
      const result = deleteBack(state);

      expect(result.text).toBe("helloworld");
      expect(result.cursorPosition).toBe(5);
    });

    test("should delete last character when cursor at end", () => {
      const state = { text: "test", cursorPosition: 4 };
      const result = deleteBack(state);

      expect(result.text).toBe("tes");
      expect(result.cursorPosition).toBe(3);
    });

    test("should delete character in middle of word", () => {
      const state = { text: "test test", cursorPosition: 4 };
      const result = deleteBack(state);

      expect(result.text).toBe("tes test");
      expect(result.cursorPosition).toBe(3);
    });

    test("should do nothing when cursor at position 0", () => {
      const state = { text: "hello", cursorPosition: 0 };
      const result = deleteBack(state);

      expect(result.text).toBe("hello");
      expect(result.cursorPosition).toBe(0);
    });
  });
});
