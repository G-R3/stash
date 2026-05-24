import { describe, expect, test } from "bun:test";
import { join } from "node:path";

const ROOT_DIR = join(import.meta.dir, "..");

describe("CLI", () => {
  test("Should show help message when --help flag is provided", async () => {
    const proc = Bun.spawn([process.execPath, "run", "index.ts", "--help"], {
      cwd: ROOT_DIR,
      stderr: "pipe",
    });
    const output = await new Response(proc.stderr).text();

    expect(output).toContain("Usage: stash [command] [query]");
    expect(await proc.exited).toBe(0);
  });

  test("Should show create help when create --help flag is provided", async () => {
    const proc = Bun.spawn(
      [process.execPath, "run", "index.ts", "create", "--help"],
      {
        cwd: ROOT_DIR,
        stderr: "pipe",
      },
    );
    const output = await new Response(proc.stderr).text();

    expect(output).toContain("Usage: stash create");
    expect(await proc.exited).toBe(0);
  });
});
