import { describe, expect, it } from "vitest";

import { htmlToMarkdown, markdownToHtml, countWords } from "./markdown";

function toMd(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return htmlToMarkdown(div);
}

function roundTrip(html: string): string {
  return markdownToHtml(toMd(html));
}

describe("markdown conversion", () => {
  it("converts headings", () => {
    expect(toMd("<h1>Bir</h1>")).toContain("# Bir");
    expect(toMd("<h2>Iki</h2>")).toContain("## Iki");
    expect(toMd("<h3>Uc</h3>")).toContain("### Uc");
  });

  it("round-trips headings", () => {
    expect(roundTrip("<h2>Baslik</h2>")).toContain("<h2>Baslik</h2>");
  });

  it("round-trips unordered lists", () => {
    const out = roundTrip("<ul><li>bir</li><li>iki</li></ul>");
    expect(out).toContain("<ul>");
    expect(out).toContain("bir");
    expect(out).toContain("iki");
  });

  it("round-trips ordered lists", () => {
    const out = roundTrip("<ol><li>bir</li><li>iki</li></ol>");
    expect(out).toContain("<ol>");
    expect(out).toContain("iki");
  });

  it("round-trips bold and italic", () => {
    const md = toMd("<p><b>kalin</b> ve <i>italik</i></p>");
    expect(md).toContain("**kalin**");
    expect(md).toMatch(/[*_]italik[*_]/);

    const html = markdownToHtml(md);
    expect(html).toMatch(/<(strong|b)>kalin<\/(strong|b)>/);
    expect(html).toMatch(/<(em|i)>italik<\/(em|i)>/);
  });

  it("round-trips links", () => {
    const md = toMd('<p><a href="https://example.com">site</a></p>');
    expect(md).toContain("[site](https://example.com)");
    expect(markdownToHtml(md)).toContain('href="https://example.com"');
  });

  it("counts words", () => {
    expect(countWords("bir iki uc")).toBe(3);
    expect(countWords("   ")).toBe(0);
  });
});
