#!/usr/bin/env bun
import { parseArgs } from "util";
import { Commands } from "./types";
import { getStashDir, showHelpMessage } from "./utils";
import { createUI } from "./ui/create";
import { config } from "./config";

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
      // Moving this here as a temp fix for cli.test.ts creating
      // a .stash` directory in the root directory.
      getStashDir(config);

      await createUI(config);
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
