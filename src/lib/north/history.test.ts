import { beforeEach, describe, expect, it } from "vitest";

import {
  MAX_VERSIONS_PER_DOC,
  clearVersions,
  deleteVersion,
  listVersions,
  pushVersion,
} from "./history";
import { createBlankDoc, type NorthDoc } from "./storage";

function docWith(html: string): NorthDoc {
  const doc = createBlankDoc("Test");
  doc.branches["main"] = { html, parent: null, createdAt: Date.now() };
  return doc;
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("version history", () => {
  it("ignores empty documents", () => {
    expect(pushVersion(docWith("   "))).toBeNull();
  });

  it("stores a snapshot with a word count", () => {
    const doc = docWith("<p>bir iki uc</p>");
    const version = pushVersion(doc, "manuel");
    expect(version).not.toBeNull();
    expect(version!.words).toBe(3);
    expect(listVersions(doc.id)).toHaveLength(1);
  });

  it("skips a snapshot when the content is unchanged", () => {
    const doc = docWith("<p>ayni</p>");
    pushVersion(doc, "manuel");
    expect(pushVersion(doc, "manuel")).toBeNull();
    expect(listVersions(doc.id)).toHaveLength(1);
  });

  it("folds rapid snapshots of the same label into one entry", () => {
    const doc = docWith("<p>ilk</p>");
    pushVersion(doc, "otomatik");
    doc.branches["main"]!.html = "<p>ikinci</p>";
    pushVersion(doc, "otomatik");
    const versions = listVersions(doc.id);
    expect(versions).toHaveLength(1);
    expect(versions[0]!.html).toBe("<p>ikinci</p>");
  });

  it("caps stored versions per document", () => {
    const doc = docWith("<p>0</p>");
    for (let i = 0; i < MAX_VERSIONS_PER_DOC + 10; i++) {
      doc.branches["main"]!.html = `<p>${i}</p>`;
      pushVersion(doc, `etiket-${i}`);
    }
    expect(listVersions(doc.id).length).toBeLessThanOrEqual(MAX_VERSIONS_PER_DOC);
  });

  it("returns newest first", () => {
    const doc = docWith("<p>a</p>");
    pushVersion(doc, "bir");
    doc.branches["main"]!.html = "<p>b</p>";
    pushVersion(doc, "iki");
    const versions = listVersions(doc.id);
    expect(versions[0]!.createdAt).toBeGreaterThanOrEqual(versions[1]!.createdAt);
  });

  it("deletes and clears", () => {
    const doc = docWith("<p>a</p>");
    const first = pushVersion(doc, "bir")!;
    deleteVersion(doc.id, first.id);
    expect(listVersions(doc.id)).toHaveLength(0);
    doc.branches["main"]!.html = "<p>c</p>";
    pushVersion(doc, "uc");
    clearVersions(doc.id);
    expect(listVersions(doc.id)).toHaveLength(0);
  });

  it("keeps history isolated per document", () => {
    const a = docWith("<p>a</p>");
    const b = docWith("<p>b</p>");
    pushVersion(a, "bir");
    pushVersion(b, "bir");
    expect(listVersions(a.id)).toHaveLength(1);
    expect(listVersions(b.id)).toHaveLength(1);
    expect(listVersions(a.id)[0]!.html).toBe("<p>a</p>");
  });
});
