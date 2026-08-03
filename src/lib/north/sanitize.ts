/**
 * Tags the North editor can actually produce. Anything else — including
 * script/iframe/object/embed/svg/img — is dropped.
 */
const ALLOWED_TAGS = new Set([
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
]);

/** `href` for links, `style` for inline colour spans. Nothing else. */
const ALLOWED_ATTR = new Set(["href", "style"]);

/**
 * Sanitize untrusted HTML before it is stored or written through innerHTML.
 * Applied at both boundaries (import and render) so that documents already
 * poisoned in localStorage are neutralised on read as well.
 *
 * Self-contained — no DOMPurify dependency — so it works identically in
 * SSR (no `document`) and in the browser.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  if (typeof document === "undefined") {
    return sanitizeRegex(html);
  }

  const host = document.createElement("div");
  host.innerHTML = html;

  walkAndClean(host);

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

function walkAndClean(root: Element): void {
  const remove: Element[] = [];

  root.querySelectorAll("*").forEach((el) => {
    const tag = el.tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tag)) {
      remove.push(el);
      return;
    }

    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();

      if (name.startsWith("on")) {
        el.removeAttribute(attr.name);
        continue;
      }
      if (name === "style" && tag !== "span") {
        el.removeAttribute(attr.name);
        continue;
      }
      if (name === "href") {
        // eslint-disable-next-line no-control-regex
        const value = attr.value.trim().replace(/[\u0000-\u0020]/g, "");
        if (/^(javascript|data|vbscript):/i.test(value)) {
          el.removeAttribute(attr.name);
        }
        continue;
      }
      if (!ALLOWED_ATTR.has(name)) {
        el.removeAttribute(attr.name);
      }
    }
  });

  for (const el of remove) {
    // Keep inner text of disallowed tags (e.g. <script> → nothing, but
    // <table> → its text). For script/style we drop content entirely.
    const tag = el.tagName.toLowerCase();
    if (tag === "script" || tag === "style") {
      el.remove();
    } else {
      const text = document.createTextNode(el.textContent ?? "");
      el.replaceWith(text);
    }
  }
}

/**
 * Regex-based fallback for SSR environments where `document` is unavailable.
 * Removes entire blocks of dangerous tags and strips all attributes except
 * href (with scheme check) and style on span.
 */
function sanitizeRegex(html: string): string {
  // Drop script/style blocks entirely (including content).
  let out = html.replace(
    /<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
    "",
  );

  // Remove all tags that aren't in the allowlist. Keep their inner text.
  out = out.replace(/<\/?([a-zA-Z0-9]+)\b[^>]*>/g, (full, tag: string) => {
    if (ALLOWED_TAGS.has(tag.toLowerCase())) {
      // Re-emit the tag without disallowed attributes.
      const isClosing = full.startsWith("</");
      if (isClosing) return `</${tag.toLowerCase()}>`;

      // Parse attributes from the opening tag.
      const attrMatches = full.match(/\s([a-zA-Z-]+)\s*=\s*"([^"]*)"/g) ?? [];
      const keptAttrs: string[] = [];
      for (const rawAttr of attrMatches) {
        const m = rawAttr.match(/^\s([a-zA-Z-]+)\s*=\s*"([^"]*)"$/);
        if (!m) continue;
        const name = m[1]!.toLowerCase();
        const value = m[2]!;

        if (name.startsWith("on")) continue;
        if (name === "href") {
          // eslint-disable-next-line no-control-regex
          const cleaned = value.trim().replace(/[\u0000-\u0020]/g, "");
          if (/^(javascript|data|vbscript):/i.test(cleaned)) continue;
          keptAttrs.push(`href="${value}"`);
        }
        if (name === "style" && tag.toLowerCase() === "span") {
          keptAttrs.push(`style="${value}"`);
        }
      }
      const attrStr = keptAttrs.length > 0 ? " " + keptAttrs.join(" ") : "";
      return `<${tag.toLowerCase()}${attrStr}>`;
    }
    // Disallowed tag — drop the tag but keep inner text (which is between
    // this and the matching close; for self-closing tags there's none).
    return "";
  });

  // Remove any stray event-handler attributes that survived (defence in depth).
  out = out.replace(/\s+on\w+\s*=\s*"[^"]*"/gi, "");

  return out;
}
