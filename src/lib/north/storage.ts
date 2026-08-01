import type { ThemeName } from "./theme";

export interface Branch {
  html: string;
  parent: string | null;
  createdAt: number;
}

export interface NorthDoc {
  title: string;
  activeBranch: string;
  branches: Record<string, Branch>;
  updatedAt: number;
  themeOverride: number | null;
  autoTime: boolean;
  flowEnabled: boolean;
}

const STORAGE_KEY = "north:doc:v1";

export const WELCOME_HTML = `<h1>North'a Hoş Geldin</h1><p>Bu belge canlı bir taslak. Soldaki panelden dal açabilir, üstten <b>Akış Modu</b>'nu açıp yazmaya devam edebilir, bir kelimeyi seçip bağlantı ekleyebilirsin. Yazdıkların bu cihazda otomatik saklanır.</p><h2>Neden North</h2><p>Klasik bir kelime işlemcinin tüm temel araçları burada: yazı tipleri, başlıklar, listeler, renkler. Üstüne modern bir yazarın ihtiyaç duyduğu katman eklendi.</p><h3>Dene</h3><p>Bir cümle yaz, birkaç saniye dur; ✨ Akış açıksa bir devam önerisi göreceksin. Tab ile kabul et, Esc ile vazgeç.</p>`;

export function createInitialDoc(): NorthDoc {
  return {
    title: "Adsız belge",
    activeBranch: "main",
    branches: { main: { html: WELCOME_HTML, parent: null, createdAt: Date.now() } },
    updatedAt: Date.now(),
    themeOverride: null,
    autoTime: true,
    flowEnabled: false,
  };
}

export function loadDoc(): NorthDoc | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<NorthDoc>;
    if (!parsed.branches || !parsed.activeBranch || !parsed.branches[parsed.activeBranch]) {
      return null;
    }
    return { ...createInitialDoc(), ...parsed } as NorthDoc;
  } catch {
    return null;
  }
}

export function saveDoc(doc: NorthDoc): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...doc, updatedAt: Date.now() }));
  } catch {
    /* quota or private mode — writing is best effort */
  }
}

export function themeOverrideOf(doc: NorthDoc): number | null {
  return doc.autoTime ? null : doc.themeOverride;
}

export type { ThemeName };
