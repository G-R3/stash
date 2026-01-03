#!/usr/bin/env bun
import { parseArgs } from "util";
import { Commands, State, state, Styles } from "./types";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { cleanUp, clearScreen, showHelpMessage, style } from "./utils";
import { create } from "./ui/create";

async function main() {
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

  const command = positionals[2];

  switch (command) {
    case Commands.CREATE:
      if (flags.help) {
        showHelpMessage(command);
        process.exit(0);
      }
      await create();
      break;
    default:
      if (flags.help) {
        showHelpMessage(command);
        process.exit(0);
      }
      if (command) {
        searchList(command);
        break;
      }
      searchList();
      break;
  }
}

/**
 * Handles rendering the search/list TUI.
 * Will render a searchable list of all available files/directories and allows the user to select and delete.
 */
function searchList(command?: string) {
  console.log("Searching and listing files/directories");
  if (command) {
    console.log("command", command);
  }
}

main();
