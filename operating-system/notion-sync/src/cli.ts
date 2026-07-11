import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { loadRuntimeConfig } from "./config.js";
import { UserFacingError } from "./errors.js";
import { NotionClient } from "./notion-client.js";
import {
  abbreviatePageId,
  diffDocument,
  getDocument,
  getDocumentStatus,
  listDocuments,
  pullDocument,
  pushDocument
} from "./sync.js";
import type { CommandFlags, DocumentMapping, RuntimeConfig, SyncActionResult } from "./types.js";

interface ParsedArgs {
  command: string;
  key: string | null;
  flags: CommandFlags;
}

const flagNames = new Set(["--dry-run", "--force", "--yes", "--json"]);

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const config = loadRuntimeConfig();
  const client = new NotionClient({
    token: config.notionApiToken,
    version: config.notionVersion
  });

  switch (args.command) {
    case "list":
      await outputValue(args.flags, await listDocuments(config, client), formatList);
      break;
    case "status":
      await outputValue(
        args.flags,
        await getDocumentStatus(config, client, getRequiredDocument(config, args.key)),
        formatStatus
      );
      break;
    case "diff":
      console.log(await diffDocument(client, getRequiredDocument(config, args.key)));
      break;
    case "push":
      await outputValue(
        args.flags,
        await pushDocument(config, client, getRequiredDocument(config, args.key), args.flags, {
          confirm
        }),
        formatActionResult
      );
      break;
    case "pull":
      await outputValue(
        args.flags,
        await pullDocument(config, client, getRequiredDocument(config, args.key), args.flags, {
          confirm
        }),
        formatActionResult
      );
      break;
    case "push-all":
      await outputValue(
        args.flags,
        await runAll(config, (document) =>
          pushDocument(config, client, document, args.flags, { confirm })
        ),
        formatActionResults
      );
      break;
    case "pull-all":
      await outputValue(
        args.flags,
        await runAll(config, (document) =>
          pullDocument(config, client, document, args.flags, { confirm })
        ),
        formatActionResults
      );
      break;
    default:
      throw new UserFacingError(`Unknown command: ${args.command}`);
  }
}

function parseArgs(argv: string[]): ParsedArgs {
  const [command, ...rest] = argv;
  if (!command) {
    throw new UserFacingError("Missing command.");
  }

  const flags: CommandFlags = {
    dryRun: false,
    force: false,
    yes: false,
    json: false
  };
  const positionals: string[] = [];

  for (const arg of rest) {
    if (arg === "--dry-run") {
      flags.dryRun = true;
    } else if (arg === "--force") {
      flags.force = true;
    } else if (arg === "--yes") {
      flags.yes = true;
    } else if (arg === "--json") {
      flags.json = true;
    } else if (arg.startsWith("--")) {
      throw new UserFacingError(`Unknown flag: ${arg}`);
    } else if (!flagNames.has(arg)) {
      positionals.push(arg);
    }
  }

  return {
    command,
    key: positionals[0] ?? null,
    flags
  };
}

function getRequiredDocument(config: RuntimeConfig, key: string | null): DocumentMapping {
  if (!key) {
    throw new UserFacingError("Missing document key.");
  }

  return getDocument(config, key);
}

async function runAll(
  config: RuntimeConfig,
  runOne: (document: DocumentMapping) => Promise<SyncActionResult>
): Promise<SyncActionResult[]> {
  const results: SyncActionResult[] = [];
  const failures: string[] = [];

  for (const document of config.documents) {
    try {
      results.push(await runOne(document));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${document.key}: ${message}`);
    }
  }

  if (failures.length > 0) {
    throw new UserFacingError(failures.join("\n"));
  }

  return results;
}

async function outputValue<T>(
  flags: CommandFlags,
  value: T,
  formatter: (value: T) => string
): Promise<void> {
  if (flags.json) {
    console.log(JSON.stringify(value, null, 2));
    return;
  }

  console.log(formatter(value));
}

function formatList(statuses: Awaited<ReturnType<typeof listDocuments>>): string {
  return statuses
    .map((status) =>
      [
        status.key,
        `  local: ${status.localPath}`,
        `  notion: ${abbreviatePageId(status.notionPageId)}`,
        `  baseline: ${status.hasBaseline ? "yes" : "no"}`,
        `  local changed: ${status.localChanged ? "yes" : "no"}`,
        `  recommendation: ${status.recommendation}`
      ].join("\n")
    )
    .join("\n\n");
}

function formatStatus(status: Awaited<ReturnType<typeof getDocumentStatus>>): string {
  return [
    `${status.key}`,
    `local path: ${status.localPath}`,
    `notion page: ${abbreviatePageId(status.notionPageId)}`,
    `local hash: ${status.localHash}`,
    `remote hash: ${status.remoteHash}`,
    `last local hash: ${status.lastLocalHash ?? "none"}`,
    `last remote hash: ${status.lastRemoteHash ?? "none"}`,
    `local changed: ${status.localChanged ? "yes" : "no"}`,
    `remote changed: ${status.remoteChanged ? "yes" : "no"}`,
    `conflict: ${status.conflict ? "yes" : "no"}`,
    `remote truncated: ${status.remoteTruncated ? "yes" : "no"}`,
    `unknown blocks: ${status.unknownBlockIds.length}`,
    `recommended action: ${status.recommendation}`
  ].join("\n");
}

function formatActionResult(result: SyncActionResult): string {
  return [
    result.message,
    `dry run: ${result.dryRun ? "yes" : "no"}`,
    `wrote remote: ${result.wroteRemote ? "yes" : "no"}`,
    `wrote local: ${result.wroteLocal ? "yes" : "no"}`,
    `wrote state: ${result.wroteState ? "yes" : "no"}`,
    `backup: ${result.backupPath ?? "none"}`
  ].join("\n");
}

function formatActionResults(results: SyncActionResult[]): string {
  return results.map(formatActionResult).join("\n\n");
}

async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({ input, output });
  try {
    const answer = await rl.question(`${message} [y/N] `);
    return answer.trim().toLowerCase() === "y" || answer.trim().toLowerCase() === "yes";
  } finally {
    rl.close();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = error instanceof UserFacingError ? 1 : 2;
});
