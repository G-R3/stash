#!/usr/bin/env bun
import { parseArgs } from "util";

enum Commands {
  CREATE = "create",
}

function main() {
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
        console.log(`
                Usage: stash create
                
                Open interactive TUI to create a new file/directory

                Flags:
                -h, --help  Show help message and exit
        `);

        process.exit(0);
      }
      create();
      break;
    default:
      if (flags.help) {
        console.log(`
            Usage: stash [command] [query]

            Run an interactive TUI to browse, search, and manage stashed files/directories.

            Commands:
              create          Open interactive TUI to create a new file/directory
            
            Arguments:
              [query]         Open interactive TUI with this query as the initial search
            
            Options:
              -h, --help      Display this message and exit
            
            Examples:
              stash           Browse and search all items
              stash notes     Browse and search with "notes" as the initial search
              stash create    Create a new file or directory
        `);
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
 * Handles rendering the create TUI.
 * Can chose between creating a file or a directory and if file/directory should
 * be prefixed with the current date.
 **/
function create() {
  console.log("Creating a new file/directory");
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
