## stash

A personal CLI tool to manage my project files and directories.

If you'd like to try it yourself I've provided a guide to run it from source

#### Features

- Interactive terminal UI for creating stash files and directories.
- Fuzzy search with ranked results (exact matches, word boundaries, and recency).
- Keyboard-first navigation for fast filtering and selection.
- Optional date prefix when creating items.
- Query-first flow: `stash <query>` opens search prefilled with your query.


#### Installation

###### Prerequisites

- [Bun](https://bun.sh/) installed (`bun --version`)

#### Try it locally

1. Clone this repo:

```bash
git clone https://github.com/G-R3/stash.git
cd stash
```

2. Install dependencies:

```bash
bun install
```

3. Run it:

```bash
bun run index.ts
```

#### Optional: make `stash` available as a command

From the project root:

```bash
bun link
stash
```

#### Custom stash location (optional)

By default, stash items are stored in `~/.stash`.
You can override this by providing an env variable in your shell profile.

```bash
export STASH_DIR=~/my-stash
```

You can also override per-command:

```bash
STASH_DIR=/your/path stash
```


#### Usage

If you ran `bun link`, use `stash ...`.  
If you did not run `bun link`, use `bun run index.ts ...`.

```bash
stash
# or
bun run index.ts
```

Open the interactive search UI. If no items are found for the stash directory, it defaults
to the create UI.

```bash
stash create
# or
bun run index.ts create
```

Open the create UI for a new file or directory.

```bash
stash --help
# or
bun run index.ts --help
```

Show help and available commands.

#### Search examples

- If you have items like `meeting-notes`, `weekly-report`, and `meeting-agenda`, typing `mn` will favor `meeting-notes` because characters match in order and at strong boundary positions.
- If both `notes` and `notes-archive` exist, searching `notes` ranks the exact `notes` item first.
