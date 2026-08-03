import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { isAllowedAiBaseUrl } from "./ai-hosts";

export const BLOCKED_HOST_ERROR = "blocked_host";

const flowInputSchema = z.object({
  context: z.string().min(20).max(4000),
  language: z.string().max(16).default("tr"),
  apiKey: z.string().min(1),
  baseUrl: z
    .string()
    .url()
    .default("https://openrouter.ai/api/v1")
    .refine(isAllowedAiBaseUrl, { message: BLOCKED_HOST_ERROR }),
  model: z.string().default("google/gemini-2.5-flash"),
});

export type FlowInput = z.infer<typeof flowInputSchema>;

/** Exported for unit tests: validates and normalises Flow Mode input. */
export function parseFlowInput(data: unknown): FlowInput {
  return flowInputSchema.parse(data);
}

/**
 * Flow Mode continuation. The user supplies their own AI API key; the server
 * proxies the request so CORS is handled and the request travels over HTTPS.
 * The target host is restricted to a fixed allowlist (see ai-hosts.ts).
 */
export const getFlowSuggestion = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    const parsed = flowInputSchema.safeParse(data);
    if (!parsed.success) {
      const blocked = parsed.error.issues.some((issue) => issue.message === BLOCKED_HOST_ERROR);
      // Surface the blocked-host case as data rather than throwing, so the UI
      // can show a specific message instead of a generic failure.
      return { blocked, invalid: !blocked } as const;
    }
    return parsed.data;
  })
  .handler(async ({ data }): Promise<{ suggestion: string; error?: string }> => {
    if ("blocked" in data) {
      return { suggestion: "", error: data.blocked ? BLOCKED_HOST_ERROR : "invalid_input" };
    }

    const { apiKey, baseUrl, model } = data;

    if (!apiKey) return { suggestion: "", error: "no_key" };
    // Defence in depth: never fetch before the allowlist check has passed.
    if (!isAllowedAiBaseUrl(baseUrl)) return { suggestion: "", error: BLOCKED_HOST_ERROR };

    try {
      const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: 80,
          temperature: 0.8,
          messages: [
            {
              role: "system",
              content:
                "You continue a writer's draft. Preserve their voice, tone and language. Reply with exactly one short continuation sentence. No quotes, no explanations, no headings.",
            },
            { role: "user", content: data.context },
          ],
        }),
      });

      if (response.status === 401) return { suggestion: "", error: "invalid_key" };
      if (response.status === 429) return { suggestion: "", error: "rate_limited" };
      if (response.status === 402) return { suggestion: "", error: "credits" };
      if (!response.ok) return { suggestion: "", error: "upstream" };

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const suggestion = (payload.choices?.[0]?.message?.content ?? "")
        .replace(/^["'`]+|["'`]+$/g, "")
        .trim();

      return { suggestion: suggestion.slice(0, 240) };
    } catch {
      return { suggestion: "", error: "network" };
    }
  });
