export interface RawDocumentConfigEntry {
  localPath: string;
  notionPageId: string;
}

export type RawDocumentConfig = Record<string, RawDocumentConfigEntry>;

export interface DocumentMapping {
  key: string;
  localPath: string;
  absoluteLocalPath: string;
  notionPageId: string;
}

export interface RuntimeConfig {
  projectRoot: string;
  repoRoot: string;
  notionApiToken: string;
  notionVersion: string;
  notionPageConfigPath: string;
  documents: DocumentMapping[];
}

export interface SyncStateEntry {
  localPath: string;
  notionPageId: string;
  localHash: string;
  remoteHash: string;
  syncedAt: string;
}

export type SyncState = Record<string, SyncStateEntry>;

export interface NotionMarkdownResponse {
  object: "page_markdown";
  id: string;
  markdown: string;
  truncated: boolean;
  unknown_block_ids: string[];
}

export type AsyncTaskStatus = "queued" | "running" | "retrying" | "succeeded" | "failed";

export interface NotionAsyncTask {
  object: "async_task";
  id: string;
  status: AsyncTaskStatus;
  status_url: string;
  poll_after_seconds?: number;
  result?: NotionMarkdownResponse;
  error?: {
    object?: string;
    status?: number;
    code?: string;
    message?: string;
  };
}

export interface NotionClientLike {
  retrieveMarkdown(pageId: string): Promise<NotionMarkdownResponse>;
  replaceMarkdown(pageId: string, markdown: string): Promise<NotionMarkdownResponse>;
}

export interface CommandFlags {
  dryRun: boolean;
  force: boolean;
  yes: boolean;
  json: boolean;
}

export interface DocumentStatus {
  key: string;
  localPath: string;
  notionPageId: string;
  localHash: string;
  remoteHash: string;
  lastLocalHash: string | null;
  lastRemoteHash: string | null;
  hasBaseline: boolean;
  localChanged: boolean;
  remoteChanged: boolean;
  conflict: boolean;
  remoteTruncated: boolean;
  unknownBlockIds: string[];
  recommendation: string;
}

export interface SyncActionResult {
  key: string;
  action: "push" | "pull";
  dryRun: boolean;
  wroteRemote: boolean;
  wroteLocal: boolean;
  wroteState: boolean;
  backupPath: string | null;
  status: DocumentStatus;
  message: string;
}
