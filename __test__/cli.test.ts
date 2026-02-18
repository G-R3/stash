import { describe, expect, test } from "bun:test";
import { join } from "node:path";

const ROOT_DIR = join(import.meta.dir, "..");

describe("CLI", () => {
  test("Should show help message when --help flag is provided", async () => {
    const proc = Bun.spawn([process.execPath, "run", "index.ts", "--help"], {
      cwd: ROOT_DIR,
    });
    const output = await new Response(proc.stdout).text();

    expect(output).toContain("Usage: stash [command] [query]");
  });

  test.skip("Should create stash directory if it doesn't exist", async () => {
    // TODO: Implement this test
  });

  test.skip("can call search with initial query arg - stash <query_to_search>", async () => {
    // TODO: implement
  });
});
