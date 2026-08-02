import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Flow Mode continuation. The user provides their own AI API key (stored in
 * localStorage on the client). The server proxies the request so the key
 * travels over HTTPS and CORS is handled server-side.
 */
export const getFlowSuggestion = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        context: z.string().min(20).max(4000),
        language: z.string().max(16).default("tr"),
        apiKey: z.string().min(1),
        baseUrl: z.string().url().default("https://openrouter.ai/api/v1"),
        model: z.string().default("google/gemini-2.5-flash"),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{ suggestion: string; error?: string }> => {
    const { apiKey, baseUrl, model } = data;

    if (!apiKey) return { suggestion: "", error: "no_key" };

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
        .replace(/^[""'`]+|[""'`]+$/g, "")
        .trim();

      return { suggestion: suggestion.slice(0, 240) };
    } catch {
      return { suggestion: "", error: "network" };
    }
  });
