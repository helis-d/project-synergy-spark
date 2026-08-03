import type { ThemeName } from "./theme";

export interface Branch {
  html: string;
  parent: string | null;
  createdAt: number;
}

export interface PageSettings {
  size: "a4" | "letter";
  orientation: "portrait" | "landscape";
  margins: { top: number; bottom: number; left: number; right: number };
  columns: 1 | 2 | 3;
  showHeader: boolean;
  showFooter: boolean;
  showPageNumbers: boolean;
  headerText: string;
  footerText: string;
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: number;
  resolved: boolean;
  anchorText: string;
}

export interface NorthDoc {
  id: string;
  title: string;
  activeBranch: string;
  branches: Record<string, Branch>;
  updatedAt: number;
  themeOverride: number | null;
  autoTime: boolean;
  flowEnabled: boolean;
  pageSettings?: PageSettings;
  comments?: Comment[];
  trackChanges?: boolean;
}

export interface ApiKeyConfig {
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
}

const DOCS_KEY = "north:docs:v2";
const ACTIVE_KEY = "north:active-doc:v2";
const API_KEY_STORE = "north:ai-key:v1";

export const WELCOME_HTML = `<h1>North'a Hoş Geldin</h1><p>Bu belge canlı bir taslak. Soldaki panelden dal açabilir, üstten <b>Akış Modu</b>'nu açıp yazmaya devam edebilir, bir kelimeyi seçip bağlantı ekleyebilirsin. Yazdıkların bu cihazda otomatik saklanır.</p><h2>Neden North</h2><p>Klasik bir kelime işlemcinin tüm temel araçları burada: yazı tipleri, başlıklar, listeler, renkler. Üstüne modern bir yazarın ihtiyaç duyduğu katman eklendi.</p><h3>Dene</h3><p>Bir cümle yaz, birkaç saniye dur; ✨ Akış açıksa bir devam önerisi göreceksin. Tab ile kabul et, Esc ile vazgeç.</p>`;

export const DEFAULT_PAGE_SETTINGS: PageSettings = {
  size: "a4",
  orientation: "portrait",
  margins: { top: 25, bottom: 25, left: 25, right: 25 },
  columns: 1,
  showHeader: false,
  showFooter: false,
  showPageNumbers: true,
  headerText: "",
  footerText: "",
};

let cachedId: string | null = null;

export function generateId(): string {
  return `doc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createInitialDoc(title?: string): NorthDoc {
  cachedId = generateId();
  return {
    id: cachedId,
    title: title ?? "Adsız belge",
    activeBranch: "main",
    branches: { main: { html: WELCOME_HTML, parent: null, createdAt: Date.now() } },
    updatedAt: Date.now(),
    themeOverride: null,
    autoTime: true,
    flowEnabled: false,
    pageSettings: DEFAULT_PAGE_SETTINGS,
    comments: [],
    trackChanges: false,
  };
}

export function createBlankDoc(title?: string): NorthDoc {
  cachedId = generateId();
  return {
    id: cachedId,
    title: title ?? "Adsız belge",
    activeBranch: "main",
    branches: { main: { html: "", parent: null, createdAt: Date.now() } },
    updatedAt: Date.now(),
    themeOverride: null,
    autoTime: true,
    flowEnabled: false,
    pageSettings: DEFAULT_PAGE_SETTINGS,
    comments: [],
    trackChanges: false,
  };
}

export function loadAllDocs(): Record<string, NorthDoc> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(DOCS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, NorthDoc>;
  } catch {
    return {};
  }
}

export function saveAllDocs(docs: Record<string, NorthDoc>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
  } catch {
    /* quota or private mode */
  }
}

export function loadDoc(id: string): NorthDoc | null {
  const docs = loadAllDocs();
  return docs[id] ?? null;
}

export function saveDoc(doc: NorthDoc): void {
  if (typeof window === "undefined") return;
  const docs = loadAllDocs();
  docs[doc.id] = { ...doc, updatedAt: Date.now() };
  saveAllDocs(docs);
}

export function deleteDoc(id: string): void {
  if (typeof window === "undefined") return;
  const docs = loadAllDocs();
  delete docs[id];
  saveAllDocs(docs);
  if (cachedId === id) cachedId = null;
}

export function getActiveDocId(): string | null {
  if (typeof window === "undefined") return null;
  if (cachedId) return cachedId;
  try {
    return window.localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function setActiveDocId(id: string): void {
  cachedId = id;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    /* ignore */
  }
}

export function listDocs(): NorthDoc[] {
  const docs = loadAllDocs();
  return Object.values(docs).sort((a, b) => b.updatedAt - a.updatedAt);
}

export function loadApiKeyConfig(): ApiKeyConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(API_KEY_STORE);
    if (!raw) return null;
    return JSON.parse(raw) as ApiKeyConfig;
  } catch {
    return null;
  }
}

export function saveApiKeyConfig(config: ApiKeyConfig): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(API_KEY_STORE, JSON.stringify(config));
  } catch {
    /* ignore */
  }
}

/**
 * Desktop builds keep the AI key in electron `safeStorage` (encrypted at rest)
 * instead of localStorage, so an XSS in the renderer cannot read it directly.
 * The localStorage path remains the web fallback.
 */
export async function loadApiKeyConfigAsync(): Promise<ApiKeyConfig | null> {
  if (typeof window === "undefined") return null;
  const desktop = window.northDesktop;
  if (desktop?.isDesktop) {
    try {
      const raw = await desktop.getSecret(API_KEY_STORE);
      return raw ? (JSON.parse(raw) as ApiKeyConfig) : null;
    } catch {
      return null;
    }
  }
  return loadApiKeyConfig();
}

export async function saveApiKeyConfigAsync(config: ApiKeyConfig): Promise<void> {
  if (typeof window === "undefined") return;
  const desktop = window.northDesktop;
  if (desktop?.isDesktop) {
    try {
      await desktop.setSecret(API_KEY_STORE, JSON.stringify(config));
    } catch {
      /* ignore */
    }
    return;
  }
  saveApiKeyConfig(config);
}

export async function clearApiKeyConfigAsync(): Promise<void> {
  if (typeof window === "undefined") return;
  const desktop = window.northDesktop;
  if (desktop?.isDesktop) {
    try {
      await desktop.deleteSecret(API_KEY_STORE);
    } catch {
      /* ignore */
    }
    return;
  }
  clearApiKeyConfig();
}

export function clearApiKeyConfig(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(API_KEY_STORE);
  } catch {
    /* ignore */
  }
}

export function themeOverrideOf(doc: NorthDoc): number | null {
  return doc.autoTime ? null : doc.themeOverride;
}

export type { ThemeName };
