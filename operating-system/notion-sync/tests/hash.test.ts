import { describe, expect, it } from "vitest";
import { sha256Text } from "../src/hash.js";

describe("sha256Text", () => {
  it("hashes empty content", () => {
    expect(sha256Text("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });

  it("hashes utf8 content", () => {
    expect(sha256Text("Solar Static Studio")).toBe(
      "f82db5241d66361d75d471304083f4af0f49361d50983b036e386269d91a9197"
    );
  });
});
