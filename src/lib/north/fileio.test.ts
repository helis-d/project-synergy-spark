import { describe, expect, it } from "vitest";

import { importFromFile } from "./fileio";

function makeFile(name: string, content: string): File {
  return new File([content], name, { type: "text/plain" });
}

describe("importFromFile", () => {
  it("sanitizes an imported .html document", async () => {
    const doc = await importFromFile(
      makeFile("payload.html", '<p>hello</p><img src=x onerror="alert(1)"><script>alert(2)</script>'),
    );
    const html = doc.branches.main.html;
    expect(html).not.toContain("onerror");
    expect(html.toLowerCase()).not.toContain("<script");
    expect(html).not.toContain("alert(2)");
    expect(html).toContain("hello");
  });

  it("sanitizes branches of an imported .nh document", async () => {
    const payload = JSON.stringify({
      format: "north",
      version: 1,
      exportedAt: Date.now(),
      doc: {
        title: "kotu",
        activeBranch: "main",
        branches: {
          main: { html: '<img src=x onerror="alert(1)">', parent: null, createdAt: 1 },
        },
        themeOverride: null,
        autoTime: true,
        flowEnabled: false,
      },
    });
    const doc = await importFromFile(makeFile("kotu.nh", payload));
    expect(doc.branches.main.html).not.toContain("onerror");
  });

  it("escapes a plain text import", async () => {
    const doc = await importFromFile(makeFile("note.txt", "<script>alert(1)</script>"));
    expect(doc.branches.main.html.toLowerCase()).not.toContain("<script");
  });
});
