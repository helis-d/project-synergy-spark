import type { ExportFormat } from "@/lib/north/fileio";

/**
 * The single action surface of the editor. Both the menu bar and the command
 * palette are built from this, so a feature added once shows up in both places
 * with identical behaviour.
 */
export interface EditorActions {
  /* document */
  newDoc: () => void;
  openLibrary: () => void;
  openFile: () => void;
  save: () => void;
  exportAs: (format: ExportFormat) => void;
  print: () => void;
  resetDoc: () => void;
  openVersions: () => void;

  /* editing */
  undo: () => void;
  redo: () => void;
  cut: () => void;
  copy: () => void;
  paste: () => void;
  find: () => void;
  selectAll: () => void;

  /* formatting */
  command: (command: string, value?: string) => void;
  block: (tag: string) => void;
  insertLink: () => void;
  insertPageBreak: () => void;
  insertRule: () => void;
  insertChecklist: () => void;
  openInsert: () => void;

  /* view */
  toggleOutline: () => void;
  toggleSide: () => void;
  toggleComments: () => void;
  toggleMarkdown: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
  openPageSettings: () => void;

  /* advanced */
  toggleFlow: () => void;
  toggleTrackChanges: () => void;
  toggleDictation: () => void;
  newBranch: () => void;
  openApiKey: () => void;
  openShortcuts: () => void;
  openPalette: () => void;
}

/** Platform-aware modifier label for shortcut hints. */
export function modKey(): string {
  if (typeof navigator === "undefined") return "Ctrl";
  return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? "⌘" : "Ctrl";
}
