#!/usr/bin/env bun
import { parseArgs } from "util";
import { config } from "./config";
import { Commands } from "./types";
import { createUI } from "./ui/create";
import { searchUI } from "./ui/search";
import { getStashDir, showHelpMessage } from "./utils";

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
      // a .stash` directory in the root.
      getStashDir(config);

      createUI(config);
      break;
    default:
      if (flags.help) {
        showHelpMessage(command);
        process.exit(0);
      }
      if (command) {
        searchUI(config, command);
        break;
      }
      searchUI(config);
      break;
  }
}

/**
 * Handles rendering the search/list TUI.
 * Will render a searchable list of all available files/directories
 */
function searchList(command?: string) {
  console.log("Searching and listing files/directories");
  if (command) {
    console.log("command", command);
  }
}

main();
