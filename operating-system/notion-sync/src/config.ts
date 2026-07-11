import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { ConfigError } from "./errors.js";
import type { DocumentMapping, RawDocumentConfig, RuntimeConfig } from "./types.js";

export const DEFAULT_NOTION_VERSION = "2026-03-11";

const sourceDir = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_PROJECT_ROOT = path.resolve(sourceDir, "..");

const envSchema = z.object({
  NOTION_API_TOKEN: z.string().trim().min(1, "NOTION_API_TOKEN is required"),
  NOTION_VERSION: z.string().trim().min(1).default(DEFAULT_NOTION_VERSION),
  NOTION_PAGE_CONFIG: z.string().trim().min(1).default("config/notion-pages.json")
});

const configEntrySchema = z.object({
  localPath: z.string().trim().min(1),
  notionPageId: z.string().trim().min(1)
});

const configSchema = z.record(configEntrySchema);

export function findRepoRoot(startDir: string): string {
  let current = path.resolve(startDir);

  while (true) {
    if (existsSync(path.join(current, ".git"))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      throw new ConfigError(`Could not find Git repository root from ${startDir}`);
    }
    current = parent;
  }
}

export function parseDotEnv(contents: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

export function loadEnv(projectRoot = DEFAULT_PROJECT_ROOT): z.infer<typeof envSchema> {
  const envPath = path.join(projectRoot, ".env");
  const fileValues = existsSync(envPath) ? parseDotEnv(readFileSync(envPath, "utf8")) : {};
  const merged = { ...fileValues, ...process.env };
  const parsed = envSchema.safeParse(merged);

  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join("; ");
    throw new ConfigError(message);
  }

  return parsed.data;
}

export function normalizeNotionPageId(pageId: string): string {
  const compact = pageId.replaceAll("-", "").trim().toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(compact)) {
    throw new ConfigError(`Invalid Notion page ID: ${pageId}`);
  }

  return [
    compact.slice(0, 8),
    compact.slice(8, 12),
    compact.slice(12, 16),
    compact.slice(16, 20),
    compact.slice(20)
  ].join("-");
}

function readJsonString(raw: string, startIndex: number): { value: string; endIndex: number } {
  let escaped = false;

  for (let index = startIndex + 1; index < raw.length; index += 1) {
    const char = raw[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      const literal = raw.slice(startIndex, index + 1);
      return { value: JSON.parse(literal) as string, endIndex: index };
    }
  }

  throw new ConfigError("Invalid JSON string in page config");
}

export function findDuplicateTopLevelKeys(raw: string): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  let depth = 0;

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];

    if (char === '"') {
      const { value, endIndex } = readJsonString(raw, index);
      let cursor = endIndex + 1;
      while (/\s/.test(raw[cursor] ?? "")) {
        cursor += 1;
      }

      if (depth === 1 && raw[cursor] === ":") {
        if (seen.has(value)) {
          duplicates.add(value);
        }
        seen.add(value);
      }

      index = endIndex;
      continue;
    }

    if (char === "{" || char === "[") {
      depth += 1;
    } else if (char === "}" || char === "]") {
      depth -= 1;
    }
  }

  return [...duplicates];
}

function validateLocalPath(repoRoot: string, localPath: string): string {
  if (path.isAbsolute(localPath)) {
    throw new ConfigError(`localPath must be repository-relative: ${localPath}`);
  }

  const absolutePath = path.resolve(repoRoot, localPath);
  const relative = path.relative(repoRoot, absolutePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new ConfigError(`localPath escapes the repository: ${localPath}`);
  }

  if (!existsSync(absolutePath)) {
    throw new ConfigError(`Mapped local file does not exist: ${localPath}`);
  }

  if (!statSync(absolutePath).isFile()) {
    throw new ConfigError(`Mapped local path is not a file: ${localPath}`);
  }

  return absolutePath;
}

export function loadDocumentConfig(configPath: string, repoRoot: string): DocumentMapping[] {
  if (!existsSync(configPath)) {
    throw new ConfigError(`Missing page config file: ${configPath}`);
  }

  const raw = readFileSync(configPath, "utf8");
  const duplicateKeys = findDuplicateTopLevelKeys(raw);
  if (duplicateKeys.length > 0) {
    throw new ConfigError(`Duplicate document keys: ${duplicateKeys.join(", ")}`);
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ConfigError(`Invalid page config JSON: ${message}`);
  }

  const parsed = configSchema.safeParse(parsedJson);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new ConfigError(message);
  }

  return normalizeDocumentConfig(parsed.data, repoRoot);
}

export function normalizeDocumentConfig(
  config: RawDocumentConfig,
  repoRoot: string
): DocumentMapping[] {
  const absolutePaths = new Map<string, string>();

  return Object.entries(config).map(([key, entry]) => {
    const absoluteLocalPath = validateLocalPath(repoRoot, entry.localPath);
    const existingKey = absolutePaths.get(absoluteLocalPath);
    if (existingKey) {
      throw new ConfigError(
        `Duplicate local path for ${existingKey} and ${key}: ${entry.localPath}`
      );
    }
    absolutePaths.set(absoluteLocalPath, key);

    return {
      key,
      localPath: path.posix.normalize(entry.localPath.replaceAll(path.sep, "/")),
      absoluteLocalPath,
      notionPageId: normalizeNotionPageId(entry.notionPageId)
    };
  });
}

export function loadRuntimeConfig(projectRoot = DEFAULT_PROJECT_ROOT): RuntimeConfig {
  const repoRoot = findRepoRoot(projectRoot);
  const env = loadEnv(projectRoot);
  const notionPageConfigPath = path.resolve(projectRoot, env.NOTION_PAGE_CONFIG);

  return {
    projectRoot,
    repoRoot,
    notionApiToken: env.NOTION_API_TOKEN,
    notionVersion: env.NOTION_VERSION,
    notionPageConfigPath,
    documents: loadDocumentConfig(notionPageConfigPath, repoRoot)
  };
}
