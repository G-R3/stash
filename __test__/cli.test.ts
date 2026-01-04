import { describe, expect, test } from "bun:test";
import { parseArgs } from "util";

describe("CLI", () => {
  test("Should show help message when --help flag is provided", async () => {
    const proc = Bun.spawn(["bun", "run", "index.ts", "--help"]);
    const output = await new Response(proc.stdout).text();

    expect(output).toContain("Usage: stash [command] [query]");
  });
});
