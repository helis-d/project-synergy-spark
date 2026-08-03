import DOMPurify from "dompurify";

/**
 * Tags the North editor can actually produce. Anything else — including
 * script/iframe/object/embed/svg/img — is dropped.
 */
const ALLOWED_TAGS = [
  "h1",
  "h2",
  "h3",
  "p",
  "br",
  "b",
  "strong",
  "i",
  "em",
  "u",
  "s",
  "strike",
  "del",
  "code",
  "blockquote",
  "ul",
  "ol",
  "li",
  "a",
  "span",
  "div",
];

/** `href` for links, `style` for inline colour spans. Nothing else. */
const ALLOWED_ATTR = ["href", "style"];

const FORBID_TAGS = ["script", "iframe", "object", "embed", "svg", "img", "style", "form"];

/**
 * Sanitize untrusted HTML before it is stored or written through innerHTML.
 * Applied at both boundaries (import and render) so that documents already
 * poisoned in localStorage are neutralised on read as well.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  if (
    typeof window === "undefined" ||
    typeof (globalThis as { document?: unknown }).document === "undefined"
  ) {
    // No DOM available (SSR): fall back to stripping every tag so nothing
    // dangerous can round-trip through the server render.
    return html.replace(/<[^>]*>/g, "");
  }

  const purify = DOMPurify as unknown as {
    sanitize: (dirty: string, cfg: Record<string, unknown>) => string;
    addHook?: (entry: string, cb: (node: Element) => void) => void;
    removeAllHooks?: () => void;
  };

  const clean = purify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    FORBID_TAGS,
    FORBID_ATTR: ["srcset", "src", "onerror", "onload", "onclick"],
    KEEP_CONTENT: true,
    USE_PROFILES: { html: true },
  });

  return stripUnsafeAttributes(clean);
}

/**
 * Second pass: DOMPurify already blocks `javascript:`/`data:` URIs and event
 * handlers, but we re-assert it here so the guarantee does not depend on
 * DOMPurify's default URI policy, and we restrict `style` to `<span>` only.
 */
function stripUnsafeAttributes(html: string): string {
  if (typeof document === "undefined") return html;
  const host = document.createElement("div");
  host.innerHTML = html;

  host.querySelectorAll("*").forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on")) {
        el.removeAttribute(attr.name);
        continue;
      }
      if (name === "style" && el.tagName.toLowerCase() !== "span") {
        el.removeAttribute(attr.name);
        continue;
      }
      if (name === "href") {
        // Control/whitespace bytes are stripped so "java\tscript:" style
        // obfuscation cannot slip past the scheme check below.
        // eslint-disable-next-line no-control-regex
        const value = attr.value.trim().replace(/[\u0000-\u0020]/g, "");
        if (/^(javascript|data|vbscript):/i.test(value)) {
          el.removeAttribute(attr.name);
        }
        continue;
      }
      if (name !== "style") {
        el.removeAttribute(attr.name);
      }
    }
  });

  return host.innerHTML;
}

/** Sanitize every branch of an imported document map. */
export function sanitizeBranches<T extends { html: string }>(
  branches: Record<string, T>,
): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [name, branch] of Object.entries(branches ?? {})) {
    out[name] = { ...branch, html: sanitizeHtml(branch?.html ?? "") };
  }
  return out;
}
