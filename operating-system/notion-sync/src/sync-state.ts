import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SyncState } from "./types.js";

export function getSyncDir(projectRoot: string): string {
  return path.join(projectRoot, ".sync");
}

export function getSyncStatePath(projectRoot: string): string {
  return path.join(getSyncDir(projectRoot), "state.json");
}

export async function readSyncState(projectRoot: string): Promise<SyncState> {
  const statePath = getSyncStatePath(projectRoot);
  if (!existsSync(statePath)) {
    return {};
  }

  return JSON.parse(await readFile(statePath, "utf8")) as SyncState;
}

export async function writeFileAtomic(filePath: string, contents: string | Buffer): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`
  );

  await writeFile(tempPath, contents);
  await rename(tempPath, filePath);
}

export async function writeSyncState(projectRoot: string, state: SyncState): Promise<void> {
  await writeFileAtomic(getSyncStatePath(projectRoot), `${JSON.stringify(state, null, 2)}\n`);
}

export async function backupLocalFile(
  projectRoot: string,
  key: string,
  filePath: string
): Promise<string> {
  const safeKey = key.replace(/[^a-z0-9._-]/gi, "-");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(getSyncDir(projectRoot), "backups", `${safeKey}-${timestamp}.md`);

  await mkdir(path.dirname(backupPath), { recursive: true });
  await copyFile(filePath, backupPath);

  return backupPath;
}
