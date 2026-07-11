import { readFile } from "node:fs/promises";
import path from "node:path";
import { ConflictError, UserFacingError } from "./errors.js";
import { sha256File, sha256Text } from "./hash.js";
import { backupLocalFile, readSyncState, writeFileAtomic, writeSyncState } from "./sync-state.js";
import { createUnifiedDiff } from "./unified-diff.js";
import type {
  CommandFlags,
  DocumentMapping,
  DocumentStatus,
  NotionClientLike,
  RuntimeConfig,
  SyncActionResult,
  SyncState,
  SyncStateEntry
} from "./types.js";

interface ConfirmationOptions {
  confirm?: (message: string) => Promise<boolean>;
}

export function getDocument(config: RuntimeConfig, key: string): DocumentMapping {
  const document = config.documents.find((entry) => entry.key === key);
  if (!document) {
    throw new UserFacingError(`Unknown document key: ${key}`);
  }

  return document;
}

function getCurrentStateEntry(state: SyncState, document: DocumentMapping): SyncStateEntry | null {
  const entry = state[document.key];
  if (!entry) {
    return null;
  }

  if (entry.localPath !== document.localPath || entry.notionPageId !== document.notionPageId) {
    return null;
  }

  return entry;
}

export async function getDocumentStatus(
  config: RuntimeConfig,
  client: NotionClientLike,
  document: DocumentMapping
): Promise<DocumentStatus> {
  const [state, localHash, remote] = await Promise.all([
    readSyncState(config.projectRoot),
    sha256File(document.absoluteLocalPath),
    client.retrieveMarkdown(document.notionPageId)
  ]);
  const remoteHash = sha256Text(remote.markdown);
  const stateEntry = getCurrentStateEntry(state, document);
  const hasBaseline = stateEntry !== null;
  const localChanged = hasBaseline ? stateEntry.localHash !== localHash : true;
  const remoteChanged = hasBaseline ? stateEntry.remoteHash !== remoteHash : true;
  const conflict = hasBaseline && localChanged && remoteChanged;

  return {
    key: document.key,
    localPath: document.localPath,
    notionPageId: document.notionPageId,
    localHash,
    remoteHash,
    lastLocalHash: stateEntry?.localHash ?? null,
    lastRemoteHash: stateEntry?.remoteHash ?? null,
    hasBaseline,
    localChanged,
    remoteChanged,
    conflict,
    remoteTruncated: remote.truncated,
    unknownBlockIds: remote.unknown_block_ids,
    recommendation: getRecommendation(hasBaseline, localChanged, remoteChanged, conflict)
  };
}

function getRecommendation(
  hasBaseline: boolean,
  localChanged: boolean,
  remoteChanged: boolean,
  conflict: boolean
): string {
  if (!hasBaseline) {
    return "No sync baseline yet; run push --dry-run or pull --dry-run before the first sync.";
  }

  if (conflict) {
    return "Both local and Notion changed; resolve manually or use --force intentionally.";
  }

  if (localChanged) {
    return "Local changed and Notion did not; push is the safe next action.";
  }

  if (remoteChanged) {
    return "Notion changed and local did not; pull is the safe next action.";
  }

  return "No changes detected.";
}

export async function listDocuments(
  config: RuntimeConfig,
  client: NotionClientLike
): Promise<DocumentStatus[]> {
  const statuses: DocumentStatus[] = [];
  for (const document of config.documents) {
    statuses.push(await getDocumentStatus(config, client, document));
  }
  return statuses;
}

export async function diffDocument(
  client: NotionClientLike,
  document: DocumentMapping
): Promise<string> {
  const [localContent, remote] = await Promise.all([
    readFile(document.absoluteLocalPath, "utf8"),
    client.retrieveMarkdown(document.notionPageId)
  ]);

  return createUnifiedDiff(
    `${document.localPath} (local)`,
    `${document.localPath} (notion)`,
    localContent,
    remote.markdown
  );
}

export async function pushDocument(
  config: RuntimeConfig,
  client: NotionClientLike,
  document: DocumentMapping,
  flags: CommandFlags,
  options: ConfirmationOptions = {}
): Promise<SyncActionResult> {
  const status = await getDocumentStatus(config, client, document);
  ensureSafeToPush(status, flags);

  const localContent = await readFile(document.absoluteLocalPath, "utf8");
  const shouldWriteRemote = shouldWriteForPush(status);
  const message = describePush(status, shouldWriteRemote);

  if (flags.dryRun) {
    return {
      key: document.key,
      action: "push",
      dryRun: true,
      wroteRemote: false,
      wroteLocal: false,
      wroteState: false,
      backupPath: null,
      status,
      message
    };
  }

  await confirmIfNeeded(message, flags, options.confirm);

  let remoteHash = status.remoteHash;
  if (shouldWriteRemote) {
    const remote = await client.replaceMarkdown(document.notionPageId, localContent);
    remoteHash = sha256Text(remote.markdown);
  }

  const state = await readSyncState(config.projectRoot);
  state[document.key] = {
    localPath: document.localPath,
    notionPageId: document.notionPageId,
    localHash: status.localHash,
    remoteHash,
    syncedAt: new Date().toISOString()
  };
  await writeSyncState(config.projectRoot, state);

  return {
    key: document.key,
    action: "push",
    dryRun: false,
    wroteRemote: shouldWriteRemote,
    wroteLocal: false,
    wroteState: true,
    backupPath: null,
    status,
    message
  };
}

export async function pullDocument(
  config: RuntimeConfig,
  client: NotionClientLike,
  document: DocumentMapping,
  flags: CommandFlags,
  options: ConfirmationOptions = {}
): Promise<SyncActionResult> {
  const status = await getDocumentStatus(config, client, document);
  ensureSafeToPull(status, flags);

  const remote = await client.retrieveMarkdown(document.notionPageId);
  const shouldWriteLocal = shouldWriteForPull(status);
  const message = describePull(status, shouldWriteLocal);

  if (flags.dryRun) {
    return {
      key: document.key,
      action: "pull",
      dryRun: true,
      wroteRemote: false,
      wroteLocal: false,
      wroteState: false,
      backupPath: null,
      status,
      message
    };
  }

  await confirmIfNeeded(message, flags, options.confirm);

  let backupPath: string | null = null;
  if (shouldWriteLocal) {
    backupPath = await backupLocalFile(
      config.projectRoot,
      document.key,
      document.absoluteLocalPath
    );
    await writeFileAtomic(document.absoluteLocalPath, remote.markdown);
  }

  const localHash = shouldWriteLocal ? sha256Text(remote.markdown) : status.localHash;
  const state = await readSyncState(config.projectRoot);
  state[document.key] = {
    localPath: document.localPath,
    notionPageId: document.notionPageId,
    localHash,
    remoteHash: sha256Text(remote.markdown),
    syncedAt: new Date().toISOString()
  };
  await writeSyncState(config.projectRoot, state);

  return {
    key: document.key,
    action: "pull",
    dryRun: false,
    wroteRemote: false,
    wroteLocal: shouldWriteLocal,
    wroteState: true,
    backupPath,
    status,
    message
  };
}

function ensureSafeToPush(status: DocumentStatus, flags: CommandFlags): void {
  ensureForceHasYes(status, flags);

  if (status.conflict && !flags.force) {
    throw new ConflictError(`${status.key}: both local and Notion changed; push stopped.`);
  }

  if (status.hasBaseline && status.remoteChanged && !status.localChanged && !flags.force) {
    throw new ConflictError(
      `${status.key}: Notion changed and local did not; pull before pushing.`
    );
  }
}

function ensureSafeToPull(status: DocumentStatus, flags: CommandFlags): void {
  ensureForceHasYes(status, flags);

  if (status.conflict && !flags.force) {
    throw new ConflictError(`${status.key}: both local and Notion changed; pull stopped.`);
  }

  if (status.hasBaseline && status.localChanged && !status.remoteChanged && !flags.force) {
    throw new ConflictError(
      `${status.key}: local changed and Notion did not; push before pulling.`
    );
  }
}

function ensureForceHasYes(status: DocumentStatus, flags: CommandFlags): void {
  if (flags.force && !flags.yes) {
    throw new UserFacingError(`${status.key}: --force requires --yes.`);
  }
}

function shouldWriteForPush(status: DocumentStatus): boolean {
  return !status.hasBaseline || status.localChanged || status.remoteChanged;
}

function shouldWriteForPull(status: DocumentStatus): boolean {
  return !status.hasBaseline || status.remoteChanged || status.localChanged;
}

function describePush(status: DocumentStatus, shouldWriteRemote: boolean): string {
  if (!shouldWriteRemote) {
    return `${status.key}: no push needed.`;
  }

  if (!status.hasBaseline) {
    return `${status.key}: first sync will replace Notion content with local content.`;
  }

  return `${status.key}: will replace Notion content with local content.`;
}

function describePull(status: DocumentStatus, shouldWriteLocal: boolean): string {
  if (!shouldWriteLocal) {
    return `${status.key}: no pull needed.`;
  }

  if (!status.hasBaseline) {
    return `${status.key}: first sync will replace local content with Notion content.`;
  }

  return `${status.key}: will replace local content with Notion content.`;
}

async function confirmIfNeeded(
  message: string,
  flags: CommandFlags,
  confirm?: (message: string) => Promise<boolean>
): Promise<void> {
  if (flags.yes) {
    return;
  }

  if (!confirm) {
    throw new UserFacingError(`${message} Pass --yes to confirm.`);
  }

  const confirmed = await confirm(`${message} Continue?`);
  if (!confirmed) {
    throw new UserFacingError("Cancelled.");
  }
}

export function abbreviatePageId(pageId: string): string {
  return `${pageId.slice(0, 8)}...${pageId.slice(-6)}`;
}

export function relativeDisplayPath(repoRoot: string, filePath: string): string {
  return path.relative(repoRoot, filePath).replaceAll(path.sep, "/");
}
