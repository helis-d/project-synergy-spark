import type { NorthDoc } from "./storage";

/**
 * Version history. Snapshots are kept per document in localStorage, capped so a
 * long writing session cannot exhaust the storage quota. Local-first: nothing
 * leaves the device.
 */
export interface Version {
  id: string;
  createdAt: number;
  branch: string;
  html: string;
  words: number;
  label: string;
}

const HISTORY_KEY = "north:history:v1";
export const MAX_VERSIONS_PER_DOC = 30;
/** Snapshots closer together than this are folded into the newest one. */
export const MIN_SNAPSHOT_GAP_MS = 60_000;

type HistoryStore = Record<string, Version[]>;

function readStore(): HistoryStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as HistoryStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: HistoryStore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(store));
  } catch {
    /* quota or private mode — history is best-effort */
  }
}

export function listVersions(docId: string): Version[] {
  return (readStore()[docId] ?? []).slice().sort((a, b) => b.createdAt - a.createdAt);
}

function countWords(html: string): number {
  return html
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * Records a snapshot of the active branch. Returns the stored version, or null
 * when the content is unchanged or the previous snapshot is too recent.
 */
export function pushVersion(doc: NorthDoc, label = "otomatik"): Version | null {
  const html = doc.branches[doc.activeBranch]?.html ?? "";
  if (!html.trim()) return null;

  const store = readStore();
  const existing = store[doc.id] ?? [];
  const newest = existing[existing.length - 1];
  if (newest && newest.html === html) return null;

  const now = Date.now();
  const version: Version = {
    id: `ver-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: now,
    branch: doc.activeBranch,
    html,
    words: countWords(html),
    label,
  };

  const foldNewest =
    !!newest &&
    newest.branch === version.branch &&
    newest.label === label &&
    now - newest.createdAt < MIN_SNAPSHOT_GAP_MS;

  const next = foldNewest ? [...existing.slice(0, -1), version] : [...existing, version];
  store[doc.id] = next.slice(-MAX_VERSIONS_PER_DOC);
  writeStore(store);
  return version;
}

export function deleteVersion(docId: string, versionId: string): void {
  const store = readStore();
  const existing = store[docId];
  if (!existing) return;
  store[docId] = existing.filter((version) => version.id !== versionId);
  writeStore(store);
}

export function clearVersions(docId: string): void {
  const store = readStore();
  delete store[docId];
  writeStore(store);
}
