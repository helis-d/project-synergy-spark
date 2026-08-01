import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Flow Mode continuation. The model key stays on the server; the browser never
 * sees a provider credential.
 */
export const getFlowSuggestion = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        context: z.string().min(20).max(4000),
        language: z.string().max(16).default("tr"),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{ suggestion: string; error?: string }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { suggestion: "", error: "unconfigured" };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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

    if (response.status === 429) return { suggestion: "", error: "rate_limited" };
    if (response.status === 402) return { suggestion: "", error: "credits" };
    if (!response.ok) return { suggestion: "", error: "upstream" };

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const suggestion = (payload.choices?.[0]?.message?.content ?? "")
      .replace(/^["“'`]+|["”'`]+$/g, "")
      .trim();

    return { suggestion: suggestion.slice(0, 240) };
  });
