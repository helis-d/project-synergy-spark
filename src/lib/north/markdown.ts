/** Minimal, dependency-free HTML <-> Markdown bridge for the North editor. */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeHref(raw: string): string {
  const href = raw.trim();
  if (href.startsWith("#") || /^https?:\/\//i.test(href) || /^mailto:/i.test(href)) {
    return escapeHtml(href);
  }
  return "#";
}

function inlineToMd(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (!(node instanceof HTMLElement)) return node.textContent ?? "";

  const inner = Array.from(node.childNodes).map(inlineToMd).join("");
  switch (node.tagName) {
    case "B":
    case "STRONG":
      return `**${inner}**`;
    case "I":
    case "EM":
      return `*${inner}*`;
    case "U":
      return `_${inner}_`;
    case "S":
    case "STRIKE":
    case "DEL":
      return `~~${inner}~~`;
    case "CODE":
      return `\`${inner}\``;
    case "A":
      return `[${inner}](${node.getAttribute("href") ?? ""})`;
    case "BR":
      return "\n";
    default:
      return inner;
  }
}

export function htmlToMarkdown(root: HTMLElement): string {
  const blocks: string[] = [];

  root.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? "").trim();
      if (text) blocks.push(text);
      return;
    }
    if (!(node instanceof HTMLElement)) return;

    const inner = Array.from(node.childNodes).map(inlineToMd).join("").trim();
    switch (node.tagName) {
      case "H1":
        blocks.push(`# ${inner}`);
        break;
      case "H2":
        blocks.push(`## ${inner}`);
        break;
      case "H3":
        blocks.push(`### ${inner}`);
        break;
      case "BLOCKQUOTE":
        blocks.push(`> ${inner}`);
        break;
      case "UL":
        blocks.push(
          Array.from(node.querySelectorAll("li"))
            .map((li) => `- ${Array.from(li.childNodes).map(inlineToMd).join("").trim()}`)
            .join("\n"),
        );
        break;
      case "OL":
        blocks.push(
          Array.from(node.querySelectorAll("li"))
            .map(
              (li, i) => `${i + 1}. ${Array.from(li.childNodes).map(inlineToMd).join("").trim()}`,
            )
            .join("\n"),
        );
        break;
      default:
        if (inner) blocks.push(inner);
    }
  });

  return blocks.filter(Boolean).join("\n\n");
}

function inlineMdToHtml(text: string): string {
  return escapeHtml(text)
    .replace(/\[(.+?)\]\((.+?)\)/g, (_m, label: string, href: string) => {
      // href arrives already escaped; re-decode quotes only for the checker.
      return `<a href="${safeHref(href.replace(/&quot;/g, '"'))}">${label}</a>`;
    })
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\*)(.+?)\*/g, "$1<em>$2</em>")
    .replace(/~~(.+?)~~/g, "<s>$1</s>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\n/g, "<br>");
}

export function markdownToHtml(markdown: string): string {
  return markdown
    .split(/\n{2,}/)
    .map((raw) => {
      const block = raw.trim();
      if (!block) return "";
      if (block.startsWith("### ")) return `<h3>${inlineMdToHtml(block.slice(4))}</h3>`;
      if (block.startsWith("## ")) return `<h2>${inlineMdToHtml(block.slice(3))}</h2>`;
      if (block.startsWith("# ")) return `<h1>${inlineMdToHtml(block.slice(2))}</h1>`;
      if (block.startsWith("> ")) return `<blockquote>${inlineMdToHtml(block.slice(2))}</blockquote>`;
      if (/^- /m.test(block) && block.split("\n").every((l) => l.trim().startsWith("- "))) {
        return `<ul>${block
          .split("\n")
          .map((l) => `<li>${inlineMdToHtml(l.trim().replace(/^- /, ""))}</li>`)
          .join("")}</ul>`;
      }
      if (block.split("\n").every((l) => /^\d+\.\s/.test(l.trim()))) {
        return `<ol>${block
          .split("\n")
          .map((l) => `<li>${inlineMdToHtml(l.trim().replace(/^\d+\.\s/, ""))}</li>`)
          .join("")}</ol>`;
      }
      return `<p>${inlineMdToHtml(block)}</p>`;
    })
    .join("");
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export function estimateReadingMinutes(words: number): number {
  return Math.max(1, Math.round(words / 200));
}
