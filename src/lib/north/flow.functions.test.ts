import { describe, expect, it, vi, afterEach } from "vitest";

import { parseFlowInput, BLOCKED_HOST_ERROR } from "./flow.functions";

const base = {
  context: "Bu en az yirmi karakterlik bir baglam metnidir.",
  language: "tr",
  apiKey: "sk-test",
  model: "google/gemini-2.5-flash",
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("flow server function validator", () => {
  it("rejects http://", () => {
    expect(() => parseFlowInput({ ...base, baseUrl: "http://openrouter.ai/api/v1" })).toThrow();
  });

  it("rejects a non-allowlisted host", () => {
    expect(() => parseFlowInput({ ...base, baseUrl: "https://evil.example.com/v1" })).toThrow();
  });

  it("accepts an allowlisted host", () => {
    const parsed = parseFlowInput({ ...base, baseUrl: "https://api.openai.com/v1" });
    expect(parsed.baseUrl).toBe("https://api.openai.com/v1");
  });

  it("rejects the cloud metadata endpoint with a blocked_host message and never fetches", () => {
    const spy = vi.spyOn(globalThis, "fetch");
    let message = "";
    try {
      parseFlowInput({ ...base, baseUrl: "http://169.254.169.254/latest" });
    } catch (error) {
      message = JSON.stringify(error);
    }
    expect(message).toContain(BLOCKED_HOST_ERROR);
    expect(spy).not.toHaveBeenCalled();
  });
});
