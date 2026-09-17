import { sanitizeHtml } from "./sanitize";

export interface BranchDiff {
  added: string[];
  removed: string[];
}

function textTokens(html: string): string[] {
  if (typeof document === "undefined") {
    return html
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .split(/\s+/)
      .filter(Boolean);
  }

  const container = document.createElement("div");
  container.innerHTML = sanitizeHtml(html);
  return (container.innerText || container.textContent || "").split(/\s+/).filter(Boolean);
}

/** Compares word sequences without relying on object/set iteration order. */
export function compareBranchHtml(mainHtml: string, branchHtml: string): BranchDiff {
  const main = textTokens(mainHtml);
  const branch = textTokens(branchHtml);
  const rows: Array<{ type: "added" | "removed"; word: string }> = [];
  const width = main.length + 1;
  const table = Array.from({ length: branch.length + 1 }, () => new Array<number>(width).fill(0));

  for (let row = 1; row <= branch.length; row++) {
    for (let column = 1; column <= main.length; column++) {
      table[row]![column] =
        branch[row - 1] === main[column - 1]
          ? table[row - 1]![column - 1]! + 1
          : Math.max(table[row - 1]![column]!, table[row]![column - 1]!);
    }
  }

  let row = branch.length;
  let column = main.length;
  while (row > 0 || column > 0) {
    if (row > 0 && column > 0 && branch[row - 1] === main[column - 1]) {
      row--;
      column--;
    } else if (column > 0 && (row === 0 || table[row]![column - 1]! >= table[row - 1]![column]!)) {
      rows.push({ type: "removed", word: main[column - 1]! });
      column--;
    } else {
      rows.push({ type: "added", word: branch[row - 1]! });
      row--;
    }
  }

  rows.reverse();
  return {
    added: rows.filter((entry) => entry.type === "added").map((entry) => entry.word),
    removed: rows.filter((entry) => entry.type === "removed").map((entry) => entry.word),
  };
}
