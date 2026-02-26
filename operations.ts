import {
  existsSync,
  mkdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import type { Config, StashItem } from "./types";
import { currentDate, getStashItems } from "./utils";

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

export const listStashItems = (config: Config): StashItem[] => getStashItems(config);

export const stashIsEmpty = (config: Config): boolean =>
  listStashItems(config).length === 0;

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
