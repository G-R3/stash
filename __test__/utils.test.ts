import { describe, expect, test } from "bun:test";
import { style } from "../utils";
import { ANSI } from "../types";

describe("style", () => {
  test("applies single style", () => {
    expect(style("hello", [ANSI.bold])).toBe("\x1b[1mhello\x1b[0m");
  });

  test("returns plain text when no styles", () => {
    expect(style("hello", [])).toBe("hello");
  });
});
