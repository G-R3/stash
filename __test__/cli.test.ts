import { describe, expect, test } from "bun:test";
import { join } from "path";

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
});
