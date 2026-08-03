import { describe, expect, it } from "vitest";

import { isAllowedAiBaseUrl, ALLOWED_AI_HOSTS } from "./ai-hosts";

describe("Flow Mode baseUrl allowlist", () => {
  it("rejects http://", () => {
    expect(isAllowedAiBaseUrl("http://openrouter.ai/api/v1")).toBe(false);
  });

  it("rejects a non-allowlisted host", () => {
    expect(isAllowedAiBaseUrl("https://169.254.169.254/latest")).toBe(false);
    expect(isAllowedAiBaseUrl("https://evil.example.com/v1")).toBe(false);
    expect(isAllowedAiBaseUrl("https://127.0.0.1:3147/v1")).toBe(false);
  });

  it("rejects a link-local metadata endpoint over http", () => {
    expect(isAllowedAiBaseUrl("http://169.254.169.254/latest")).toBe(false);
  });

  it("rejects garbage", () => {
    expect(isAllowedAiBaseUrl("not-a-url")).toBe(false);
    expect(isAllowedAiBaseUrl("")).toBe(false);
  });

  it("accepts every allowlisted host over https", () => {
    for (const host of ALLOWED_AI_HOSTS) {
      expect(isAllowedAiBaseUrl(`https://${host}/v1`)).toBe(true);
    }
  });

  it("does not accept a lookalike subdomain suffix", () => {
    expect(isAllowedAiBaseUrl("https://openrouter.ai.evil.com/v1")).toBe(false);
  });
});
