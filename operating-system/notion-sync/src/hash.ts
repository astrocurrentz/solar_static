import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export function sha256Text(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function sha256Buffer(value: Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function sha256File(filePath: string): Promise<string> {
  return sha256Buffer(await readFile(filePath));
}
