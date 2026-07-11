import { existsSync } from "node:fs";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictError, UserFacingError } from "../src/errors.js";
import { sha256Text } from "../src/hash.js";
import { diffDocument, getDocumentStatus, pullDocument, pushDocument } from "../src/sync.js";
import type { CommandFlags, NotionClientLike, RuntimeConfig, SyncState } from "../src/types.js";

const yesFlags: CommandFlags = { dryRun: false, force: false, yes: true, json: false };
const dryRunFlags: CommandFlags = { dryRun: true, force: false, yes: false, json: false };

async function makeRuntime(localContent: string, state?: SyncState): Promise<RuntimeConfig> {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), "notion-sync-"));
  const projectRoot = path.join(repoRoot, "operating-system", "notion-sync");
  const localPath = "company/mission.md";

  await mkdir(path.join(repoRoot, ".git"));
  await mkdir(path.dirname(path.join(repoRoot, localPath)), { recursive: true });
  await mkdir(projectRoot, { recursive: true });
  await writeFile(path.join(repoRoot, localPath), localContent);

  if (state) {
    await mkdir(path.join(projectRoot, ".sync"), { recursive: true });
    await writeFile(path.join(projectRoot, ".sync", "state.json"), JSON.stringify(state));
  }

  return {
    projectRoot,
    repoRoot,
    notionApiToken: "token",
    notionVersion: "2026-03-11",
    notionPageConfigPath: path.join(projectRoot, "config", "notion-pages.json"),
    documents: [
      {
        key: "mission",
        localPath,
        absoluteLocalPath: path.join(repoRoot, localPath),
        notionPageId: "39aa8019-6d6d-801c-8a19-da22d0533462"
      }
    ]
  };
}

function makeClient(markdown: string): NotionClientLike & {
  replaceMarkdown: ReturnType<typeof vi.fn>;
} {
  return {
    retrieveMarkdown: vi.fn().mockResolvedValue({
      object: "page_markdown",
      id: "page",
      markdown,
      truncated: false,
      unknown_block_ids: []
    }),
    replaceMarkdown: vi.fn().mockImplementation(async (_pageId: string, nextMarkdown: string) => ({
      object: "page_markdown",
      id: "page",
      markdown: nextMarkdown,
      truncated: false,
      unknown_block_ids: []
    }))
  };
}

describe("sync", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("reports first sync without treating it as a conflict", async () => {
    const config = await makeRuntime("");
    const status = await getDocumentStatus(config, makeClient(""), config.documents[0]!);

    expect(status.hasBaseline).toBe(false);
    expect(status.conflict).toBe(false);
    expect(status.localChanged).toBe(true);
    expect(status.remoteChanged).toBe(true);
  });

  it("keeps dry-run push from writing remote or state", async () => {
    const config = await makeRuntime("");
    const client = makeClient("");
    const result = await pushDocument(config, client, config.documents[0]!, dryRunFlags);

    expect(result.dryRun).toBe(true);
    expect(client.replaceMarkdown).not.toHaveBeenCalled();
    expect(existsSync(path.join(config.projectRoot, ".sync", "state.json"))).toBe(false);
  });

  it("writes remote and state on confirmed first push", async () => {
    const config = await makeRuntime("");
    const client = makeClient("remote");
    const result = await pushDocument(config, client, config.documents[0]!, yesFlags);
    const state = JSON.parse(
      await readFile(path.join(config.projectRoot, ".sync", "state.json"), "utf8")
    ) as SyncState;

    expect(result.wroteRemote).toBe(true);
    expect(state.mission?.localHash).toBe(sha256Text(""));
  });

  it("blocks push when only remote changed", async () => {
    const localHash = sha256Text("local");
    const config = await makeRuntime("local", {
      mission: {
        localPath: "company/mission.md",
        notionPageId: "39aa8019-6d6d-801c-8a19-da22d0533462",
        localHash,
        remoteHash: sha256Text("old remote"),
        syncedAt: "2026-07-11T00:00:00.000Z"
      }
    });

    await expect(
      pushDocument(config, makeClient("new remote"), config.documents[0]!, yesFlags)
    ).rejects.toThrow(ConflictError);
  });

  it("requires --yes with --force", async () => {
    const config = await makeRuntime("local", {
      mission: {
        localPath: "company/mission.md",
        notionPageId: "39aa8019-6d6d-801c-8a19-da22d0533462",
        localHash: sha256Text("old local"),
        remoteHash: sha256Text("old remote"),
        syncedAt: "2026-07-11T00:00:00.000Z"
      }
    });

    await expect(
      pushDocument(config, makeClient("new remote"), config.documents[0]!, {
        dryRun: false,
        force: true,
        yes: false,
        json: false
      })
    ).rejects.toThrow(UserFacingError);
  });

  it("creates a backup and writes local content on pull", async () => {
    const localHash = sha256Text("local");
    const remoteHash = sha256Text("old remote");
    const config = await makeRuntime("local", {
      mission: {
        localPath: "company/mission.md",
        notionPageId: "39aa8019-6d6d-801c-8a19-da22d0533462",
        localHash,
        remoteHash,
        syncedAt: "2026-07-11T00:00:00.000Z"
      }
    });

    const result = await pullDocument(
      config,
      makeClient("new remote"),
      config.documents[0]!,
      yesFlags
    );

    expect(result.backupPath).toBeTruthy();
    expect(await readFile(config.documents[0]!.absoluteLocalPath, "utf8")).toBe("new remote");
  });

  it("shows a unified diff", async () => {
    const config = await makeRuntime("local\n");
    const diff = await diffDocument(makeClient("remote\n"), config.documents[0]!);

    expect(diff).toContain("--- company/mission.md (local)");
    expect(diff).toContain("+++ company/mission.md (notion)");
  });
});
