import { homedir } from "node:os";
import { join } from "node:path";

export const config = {
  stashDir: process.env.STASH_DIR || join(homedir(), ".stash"),
};
