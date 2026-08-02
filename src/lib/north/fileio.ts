import type { NorthDoc } from "./storage";
import { generateId, createBlankDoc } from "./storage";
import { htmlToMarkdown, markdownToHtml } from "./markdown";

export type ExportFormat = "nh" | "md" | "html" | "txt";

export interface NhFile {
  format: "north";
  version: 1;
  exportedAt: number;
  doc: {
    title: string;
    activeBranch: string;
    branches: Record<string, { html: string; parent: string | null; createdAt: number }>;
    themeOverride: number | null;
    autoTime: boolean;
    flowEnabled: boolean;
  };
}

const FORMAT_LABELS: Record<ExportFormat, string> = {
  nh: "North belgesi (.nh)",
  md: "Markdown (.md)",
  html: "HTML (.html)",
  txt: "Düz metin (.txt)",
};

export function getFormatLabel(format: ExportFormat): string {
  return FORMAT_LABELS[format];
}

export function getExtension(format: ExportFormat): string {
  return format;
}

function sanitizeFilename(name: string): string {
  return (
    name
      .trim()
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80) || "north-belge"
  );
}

function download(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportDoc(doc: NorthDoc, format: ExportFormat): void {
  const base = sanitizeFilename(doc.title);
  const branch = doc.branches[doc.activeBranch];
  const html = branch?.html ?? "";

  switch (format) {
    case "nh": {
      const payload: NhFile = {
        format: "north",
        version: 1,
        exportedAt: Date.now(),
        doc: {
          title: doc.title,
          activeBranch: doc.activeBranch,
          branches: doc.branches,
          themeOverride: doc.themeOverride,
          autoTime: doc.autoTime,
          flowEnabled: doc.flowEnabled,
        },
      };
      download(JSON.stringify(payload, null, 2), `${base}.nh`, "application/json");
      break;
    }
    case "md": {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      download(htmlToMarkdown(tempDiv), `${base}.md`, "text/markdown");
      break;
    }
    case "html": {
      download(html, `${base}.html`, "text/html");
      break;
    }
    case "txt": {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      download(tempDiv.innerText, `${base}.txt`, "text/plain");
      break;
    }
  }
}

export function exportBranch(doc: NorthDoc, branchName: string, format: ExportFormat): void {
  const base = sanitizeFilename(`${doc.title}-${branchName}`);
  const branch = doc.branches[branchName];
  if (!branch) return;
  const html = branch.html;

  switch (format) {
    case "nh": {
      const payload: NhFile = {
        format: "north",
        version: 1,
        exportedAt: Date.now(),
        doc: {
          title: `${doc.title} — ${branchName}`,
          activeBranch: "main",
          branches: { main: { html, parent: null, createdAt: branch.createdAt } },
          themeOverride: doc.themeOverride,
          autoTime: doc.autoTime,
          flowEnabled: doc.flowEnabled,
        },
      };
      download(JSON.stringify(payload, null, 2), `${base}.nh`, "application/json");
      break;
    }
    case "md": {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      download(htmlToMarkdown(tempDiv), `${base}.md`, "text/markdown");
      break;
    }
    case "html": {
      download(html, `${base}.html`, "text/html");
      break;
    }
    case "txt": {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;
      download(tempDiv.innerText, `${base}.txt`, "text/plain");
      break;
    }
  }
}

export function importFromFile(file: File): Promise<NorthDoc> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

      if (ext === "nh" || ext === "json") {
        try {
          const parsed = JSON.parse(text) as NhFile;
          if (parsed.format === "north" && parsed.doc) {
            const d = parsed.doc;
            resolve({
              id: generateId(),
              title: d.title || file.name.replace(/\.[^.]+$/, ""),
              activeBranch: d.activeBranch || "main",
              branches: d.branches,
              updatedAt: Date.now(),
              themeOverride: d.themeOverride ?? null,
              autoTime: d.autoTime ?? true,
              flowEnabled: d.flowEnabled ?? false,
            });
            return;
          }
        } catch {
          /* not JSON, try as text */
        }
      }

      if (ext === "md" || ext === "markdown") {
        resolve({
          ...createBlankDoc(file.name.replace(/\.[^.]+$/, "")),
          branches: { main: { html: markdownToHtml(text), parent: null, createdAt: Date.now() } },
        });
        return;
      }

      if (ext === "html" || ext === "htm") {
        resolve({
          ...createBlankDoc(file.name.replace(/\.[^.]+$/, "")),
          branches: { main: { html: text, parent: null, createdAt: Date.now() } },
        });
        return;
      }

      // .txt or anything else — wrap as a single paragraph
      const escaped = text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .split(/\n\n+/)
        .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
        .join("");
      resolve({
        ...createBlankDoc(file.name.replace(/\.[^.]+$/, "")),
        branches: { main: { html: escaped, parent: null, createdAt: Date.now() } },
      });
    };
    reader.onerror = () => reject(new Error("Dosya okunamadı."));
    reader.readAsText(file);
  });
}
