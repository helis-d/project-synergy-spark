import { describe, expect, it } from "vitest";

import { sanitizeHtml, sanitizeBranches } from "./sanitize";

describe("sanitizeHtml", () => {
  it("strips an img onerror payload entirely", () => {
    const out = sanitizeHtml('<p>hi</p><img src=x onerror="alert(1)">');
    expect(out).not.toContain("onerror");
    expect(out).not.toContain("<img");
    expect(out).toContain("hi");
  });

  it("strips script tags", () => {
    const out = sanitizeHtml("<p>a</p><script>alert(2)</script>");
    expect(out.toLowerCase()).not.toContain("<script");
    expect(out).not.toContain("alert(2)");
  });

  it("strips javascript: hrefs but keeps safe links", () => {
    const bad = sanitizeHtml('<a href="javascript:alert(1)">x</a>');
    expect(bad).not.toContain("javascript:");

    const good = sanitizeHtml('<a href="https://example.com">x</a>');
    expect(good).toContain('href="https://example.com"');
  });

  it("drops iframe, object, embed and svg", () => {
    const out = sanitizeHtml(
      "<iframe src=x></iframe><object></object><embed><svg onload=alert(1)></svg>",
    );
    expect(out).not.toMatch(/iframe|object|embed|svg/i);
  });

  it("keeps editor formatting tags", () => {
    const out = sanitizeHtml("<h2>T</h2><ul><li><b>b</b> <i>i</i></li></ul>");
    expect(out).toContain("<h2>");
    expect(out).toContain("<li>");
    expect(out).toContain("<b>");
  });

  it("allows style only on span", () => {
    expect(sanitizeHtml('<span style="color:red">a</span>')).toContain("style");
    expect(sanitizeHtml('<p style="color:red">a</p>')).not.toContain("style");
  });

  it("sanitizes every branch of an imported document", () => {
    const out = sanitizeBranches({
      main: { html: "<script>alert(1)</script><p>ok</p>" },
      alt: { html: '<img src=x onerror="alert(1)">' },
    });
    expect((out['main']?.html ?? '').toLowerCase()).not.toContain("<script");
    expect((out['alt']?.html ?? '')).not.toContain("onerror");
  });
});
