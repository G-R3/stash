import {
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import type { Config, StashItem } from "./types";

export type CreateStashItemInput = {
  text: string;
  isFile: boolean;
  prefix: boolean;
};

export type CreateStashItemResult = {
  success: boolean;
  message: string;
  data: {
    name: string;
    type: "file" | "directory";
    path: string;
    mtime?: Date;
    size?: number;
  };
};

export const currentDate = new Date().toISOString().split("T")[0];

export function getStashDir(config: Config) {
  if (!existsSync(config.stashDir)) {
    console.log(
      `Stash directory ${config.stashDir} does not exist, creating...`,
    );
    mkdirSync(config.stashDir, { recursive: true });
  }

  return config.stashDir;
}

export const getStashItems = (config: Config): StashItem[] => {
  const stashPath = getStashDir(config);

  const entries = readdirSync(stashPath);

  const items: Array<StashItem> = [];

  for (const entry of entries) {
    const fullPath = join(stashPath, entry);
    const stats = statSync(fullPath);

    items.push({
      name: entry,
      type: stats.isFile() ? "file" : "directory",
      path: fullPath,
      mtime: stats.mtime,
      size: stats.size,
      score: 0,
      matchedIndices: [],
    });
  }

  return items.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
};

export function isStashEmpty(config: Config) {
  const items = getStashItems(config);

  return items.length === 0;
}

export function createStashItem(
  state: CreateStashItemInput,
  config: Config,
): CreateStashItemResult {
  const name = state.prefix ? `${currentDate}-${state.text}` : state.text;
  const fullPath = join(config.stashDir, name);
  const type = state.isFile ? "file" : "directory";

  if (existsSync(fullPath)) {
    return {
      success: false,
      message: `File/directory already exists: ${name}`,
      data: {
        name,
        type,
        path: fullPath,
      },
    };
  }

  if (state.isFile) {
    writeFileSync(fullPath, "", { encoding: "utf-8" });
  } else {
    mkdirSync(fullPath, { recursive: true });
  }

  const fileStats = statSync(fullPath);

  return {
    success: true,
    message: `Created ${type}: ${name}`,
    data: {
      name,
      type,
      path: fullPath,
      mtime: fileStats.mtime,
      size: fileStats.size,
    },
  };
}

export function deleteStashItem(path: string): boolean {
  if (!existsSync(path)) {
    return false;
  }

  rmSync(path, { recursive: true, force: true });
  return true;
}
