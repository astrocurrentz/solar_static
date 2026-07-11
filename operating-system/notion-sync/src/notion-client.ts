import { z } from "zod";
import { NotionApiError, UserFacingError } from "./errors.js";
import type { NotionAsyncTask, NotionMarkdownResponse } from "./types.js";

const notionMarkdownResponseSchema = z.object({
  object: z.literal("page_markdown"),
  id: z.string(),
  markdown: z.string(),
  truncated: z.boolean(),
  unknown_block_ids: z.array(z.string())
});

const asyncTaskSchema = z.object({
  object: z.literal("async_task"),
  id: z.string(),
  status: z.enum(["queued", "running", "retrying", "succeeded", "failed"]),
  status_url: z.string(),
  poll_after_seconds: z.number().optional(),
  result: notionMarkdownResponseSchema.optional(),
  error: z
    .object({
      object: z.string().optional(),
      status: z.number().optional(),
      code: z.string().optional(),
      message: z.string().optional()
    })
    .optional()
});

type FetchLike = typeof fetch;

interface NotionClientOptions {
  token: string;
  version: string;
  fetchImpl?: FetchLike;
  sleep?: (milliseconds: number) => Promise<void>;
  maxPolls?: number;
}

export class NotionClient {
  private readonly token: string;
  private readonly version: string;
  private readonly fetchImpl: FetchLike;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly maxPolls: number;

  constructor(options: NotionClientOptions) {
    this.token = options.token;
    this.version = options.version;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.sleep =
      options.sleep ??
      ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
    this.maxPolls = options.maxPolls ?? 60;
  }

  async retrieveMarkdown(pageId: string): Promise<NotionMarkdownResponse> {
    const response = await this.request(`/v1/pages/${pageId}/markdown`, {
      method: "GET"
    });

    return this.parseMarkdownResponse(response);
  }

  async replaceMarkdown(pageId: string, markdown: string): Promise<NotionMarkdownResponse> {
    const response = await this.request(`/v1/pages/${pageId}/markdown`, {
      method: "PATCH",
      body: JSON.stringify({
        type: "replace_content",
        replace_content: {
          new_str: markdown
        },
        allow_async: true
      })
    });

    const body = await this.parseJson(response);
    const asyncTask = asyncTaskSchema.safeParse(body);
    if (asyncTask.success) {
      return this.pollAsyncTask(asyncTask.data);
    }

    return this.validateMarkdownResponse(body);
  }

  private async pollAsyncTask(task: NotionAsyncTask): Promise<NotionMarkdownResponse> {
    let currentTask = task;

    for (let pollCount = 0; pollCount < this.maxPolls; pollCount += 1) {
      if (currentTask.status === "succeeded") {
        if (!currentTask.result) {
          throw new UserFacingError("Notion async task succeeded without a markdown result");
        }
        return currentTask.result;
      }

      if (currentTask.status === "failed") {
        const status = currentTask.error?.status ?? 500;
        const code = currentTask.error?.code ?? "async_task_failed";
        const message = currentTask.error?.message ?? "Notion async task failed";
        throw new NotionApiError(status, code, message);
      }

      await this.sleep(Math.max(currentTask.poll_after_seconds ?? 1, 1) * 1000);
      const response = await this.request(`/v1/async_tasks/${currentTask.id}`, {
        method: "GET"
      });
      const body = await this.parseJson(response);
      const parsed = asyncTaskSchema.safeParse(body);
      if (!parsed.success) {
        throw new UserFacingError("Notion async task returned an unexpected response");
      }
      currentTask = parsed.data;
    }

    throw new UserFacingError("Timed out waiting for Notion async task to finish");
  }

  private async request(path: string, init: RequestInit): Promise<Response> {
    const response = await this.fetchImpl(`https://api.notion.com${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        "Notion-Version": this.version,
        ...init.headers
      }
    });

    if (!response.ok) {
      const body = await this.parseJson(response).catch(() => null);
      const errorBody = z
        .object({
          code: z.string().optional(),
          message: z.string().optional()
        })
        .safeParse(body);
      throw new NotionApiError(
        response.status,
        errorBody.success ? (errorBody.data.code ?? "unknown_error") : "unknown_error",
        errorBody.success ? (errorBody.data.message ?? response.statusText) : response.statusText
      );
    }

    return response;
  }

  private async parseMarkdownResponse(response: Response): Promise<NotionMarkdownResponse> {
    return this.validateMarkdownResponse(await this.parseJson(response));
  }

  private validateMarkdownResponse(body: unknown): NotionMarkdownResponse {
    const parsed = notionMarkdownResponseSchema.safeParse(body);
    if (!parsed.success) {
      throw new UserFacingError("Notion returned an unexpected markdown response");
    }

    return parsed.data;
  }

  private async parseJson(response: Response): Promise<unknown> {
    return response.json() as Promise<unknown>;
  }
}
