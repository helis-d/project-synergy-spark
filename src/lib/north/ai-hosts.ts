/**
 * Hosts the Flow Mode proxy is permitted to reach. The server function makes an
 * outbound request carrying the user's bearer token, so an unrestricted
 * `baseUrl` would be an SSRF vector — under Electron the server binds
 * 127.0.0.1, which would expose the user's own localhost services.
 */
export const ALLOWED_AI_HOSTS = [
  "openrouter.ai",
  "api.openai.com",
  "api.groq.com",
  "api.deepseek.com",
] as const;

export type AllowedAiHost = (typeof ALLOWED_AI_HOSTS)[number];

export function isAllowedAiBaseUrl(baseUrl: string): boolean {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  return (ALLOWED_AI_HOSTS as readonly string[]).includes(url.hostname);
}
