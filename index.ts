#!/usr/bin/env bun
import { parseArgs } from "node:util";
import { config } from "./config";
import { Commands } from "./types";
import { createUI } from "./ui/create";
import { searchUI } from "./ui/search";
import { getStashDir, isStashEmpty, showHelpMessage } from "./utils";

async function main() {
  getStashDir(config);

  const { values: flags, positionals } = parseArgs({
    args: Bun.argv,
    options: {
      help: {
        type: "boolean",
        short: "h",
        description: "Show help message and exit",
      },
    },
    strict: true,
    allowPositionals: true,
  });

  const arg = positionals[2];

  switch (arg) {
    case Commands.CREATE:
      if (flags.help) {
        showHelpMessage(arg);
        process.exit(0);
      }

      createUI(config);
      break;
    default:
      if (flags.help) {
        showHelpMessage(arg);
        process.exit(0);
      }

      isStashEmpty(config) ? createUI(config) : searchUI(config, arg);

      break;
  }
}

main();
