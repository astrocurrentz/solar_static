import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ConfigError } from "../src/errors.js";
import {
  findDuplicateTopLevelKeys,
  loadDocumentConfig,
  normalizeDocumentConfig,
  normalizeNotionPageId,
  parseDotEnv
} from "../src/config.js";

async function makeRepo(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "notion-sync-config-"));
  await mkdir(path.join(root, ".git"));
  await mkdir(path.join(root, "company"));
  await writeFile(path.join(root, "company", "mission.md"), "");
  await writeFile(path.join(root, "company", "services.md"), "");
  return root;
}

describe("config", () => {
  it("parses dotenv values without printing secrets", () => {
    expect(parseDotEnv("NOTION_API_TOKEN=secret\nNOTION_VERSION=2026-03-11\n")).toEqual({
      NOTION_API_TOKEN: "secret",
      NOTION_VERSION: "2026-03-11"
    });
  });

  it("normalizes notion page IDs", () => {
    expect(normalizeNotionPageId("39aa80196d6d801c8a19da22d0533462")).toBe(
      "39aa8019-6d6d-801c-8a19-da22d0533462"
    );
  });

  it("rejects malformed notion page IDs", () => {
    expect(() => normalizeNotionPageId("REPLACE_WITH_NOTION_PAGE_ID")).toThrow(ConfigError);
  });

  it("detects duplicate top-level JSON keys", () => {
    expect(
      findDuplicateTopLevelKeys(
        '{"mission":{"localPath":"company/mission.md"},"mission":{"localPath":"x"}}'
      )
    ).toEqual(["mission"]);
  });

  it("rejects duplicate local paths", async () => {
    const repoRoot = await makeRepo();
    expect(() =>
      normalizeDocumentConfig(
        {
          mission: {
            localPath: "company/mission.md",
            notionPageId: "39aa80196d6d801c8a19da22d0533462"
          },
          other: {
            localPath: "company/mission.md",
            notionPageId: "39aa80196d6d801c8a19da22d0533463"
          }
        },
        repoRoot
      )
    ).toThrow(ConfigError);
  });

  it("rejects paths outside the repo", async () => {
    const repoRoot = await makeRepo();
    expect(() =>
      normalizeDocumentConfig(
        {
          mission: {
            localPath: "../outside.md",
            notionPageId: "39aa80196d6d801c8a19da22d0533462"
          }
        },
        repoRoot
      )
    ).toThrow(ConfigError);
  });

  it("rejects missing local files", async () => {
    const repoRoot = await makeRepo();
    expect(() =>
      normalizeDocumentConfig(
        {
          missing: {
            localPath: "company/missing.md",
            notionPageId: "39aa80196d6d801c8a19da22d0533462"
          }
        },
        repoRoot
      )
    ).toThrow(ConfigError);
  });

  it("loads a valid document config", async () => {
    const repoRoot = await makeRepo();
    const configPath = path.join(repoRoot, "config.json");
    await writeFile(
      configPath,
      JSON.stringify({
        mission: {
          localPath: "company/mission.md",
          notionPageId: "39aa80196d6d801c8a19da22d0533462"
        }
      })
    );

    expect(loadDocumentConfig(configPath, repoRoot)).toMatchObject([
      {
        key: "mission",
        localPath: "company/mission.md",
        notionPageId: "39aa8019-6d6d-801c-8a19-da22d0533462"
      }
    ]);
  });
});
