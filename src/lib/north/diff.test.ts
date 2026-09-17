import { describe, expect, it } from "vitest";
import { compareBranchHtml } from "./diff";

describe("compareBranchHtml", () => {
  it("reports ordered additions and removals", () => {
    expect(compareBranchHtml("<p>one two three</p>", "<p>one new three four</p>")).toEqual({
      added: ["new", "four"],
      removed: ["two"],
    });
  });

  it("handles identical, empty, and repeated words deterministically", () => {
    expect(compareBranchHtml("<p>same same</p>", "<p>same same</p>")).toEqual({
      added: [],
      removed: [],
    });
    expect(compareBranchHtml("", "<p>new</p>")).toEqual({ added: ["new"], removed: [] });
    expect(compareBranchHtml("<p>same same</p>", "<p>same</p>")).toEqual({
      added: [],
      removed: ["same"],
    });
  });
});
