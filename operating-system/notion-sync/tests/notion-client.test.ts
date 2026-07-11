import { describe, expect, it, vi } from "vitest";
import { NotionApiError } from "../src/errors.js";
import { NotionClient } from "../src/notion-client.js";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "Content-Type": "application/json" }
  });
}

describe("NotionClient", () => {
  it("retrieves markdown", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        object: "page_markdown",
        id: "page",
        markdown: "hello",
        truncated: false,
        unknown_block_ids: []
      })
    );
    const client = new NotionClient({ token: "token", version: "2026-03-11", fetchImpl });

    await expect(client.retrieveMarkdown("page")).resolves.toMatchObject({ markdown: "hello" });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.notion.com/v1/pages/page/markdown",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer token",
          "Notion-Version": "2026-03-11"
        })
      })
    );
  });

  it("polls async markdown writes to success", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(
          {
            object: "async_task",
            id: "task_1",
            status: "queued",
            status_url: "https://api.notion.com/v1/async_tasks/task_1",
            poll_after_seconds: 1
          },
          { status: 202 }
        )
      )
      .mockResolvedValueOnce(
        jsonResponse({
          object: "async_task",
          id: "task_1",
          status: "succeeded",
          status_url: "https://api.notion.com/v1/async_tasks/task_1",
          result: {
            object: "page_markdown",
            id: "page",
            markdown: "done",
            truncated: false,
            unknown_block_ids: []
          }
        })
      );
    const client = new NotionClient({
      token: "token",
      version: "2026-03-11",
      fetchImpl,
      sleep: async () => undefined
    });

    await expect(client.replaceMarkdown("page", "done")).resolves.toMatchObject({
      markdown: "done"
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("throws on async markdown failure", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(
          {
            object: "async_task",
            id: "task_1",
            status: "queued",
            status_url: "https://api.notion.com/v1/async_tasks/task_1",
            poll_after_seconds: 1
          },
          { status: 202 }
        )
      )
      .mockResolvedValueOnce(
        jsonResponse({
          object: "async_task",
          id: "task_1",
          status: "failed",
          status_url: "https://api.notion.com/v1/async_tasks/task_1",
          error: {
            status: 400,
            code: "validation_error",
            message: "bad markdown"
          }
        })
      );
    const client = new NotionClient({
      token: "token",
      version: "2026-03-11",
      fetchImpl,
      sleep: async () => undefined
    });

    await expect(client.replaceMarkdown("page", "bad")).rejects.toThrow(NotionApiError);
  });

  it("surfaces API errors", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          object: "error",
          code: "object_not_found",
          message: "missing"
        },
        { status: 404 }
      )
    );
    const client = new NotionClient({ token: "token", version: "2026-03-11", fetchImpl });

    await expect(client.retrieveMarkdown("missing")).rejects.toThrow("object_not_found");
  });
});
