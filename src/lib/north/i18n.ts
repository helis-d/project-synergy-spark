import { useCallback, useEffect, useState } from "react";

export const SUPPORTED_LOCALES = ["en", "tr", "de", "es"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

const LOCALE_KEY = "north:locale:v1";
const DEFAULT_LOCALE: Locale = "en";

type Messages = Record<string, string>;

const messages: Record<Locale, Messages> = {
  en: {
    library: "Document library",
    close: "Close",
    search: "Search documents…",
    openFile: "Open file",
    newDocument: "New document",
    noMatches: "No documents match your search.",
    emptyLibrary: "No documents yet. Create a new document or open a file.",
    deleteDocument: "Delete document",
    unnamed: "Untitled document",
    emptyDocument: "Empty document",
    words: "words",
    branches: "branches",
    justNow: "just now",
    minutesAgo: "{count} min ago",
    hoursAgo: "{count} hr ago",
    daysAgo: "{count} days ago",
    language: "Language",
  },
  tr: {
    library: "Belge Kitaplığı",
    close: "Kapat",
    search: "Belge ara…",
    openFile: "Dosya aç",
    newDocument: "Yeni belge",
    noMatches: "Aramanla eşleşen belge yok.",
    emptyLibrary: "Henüz belge yok. Yeni bir belge oluştur veya dosya aç.",
    deleteDocument: "Belgeyi sil",
    unnamed: "Adsız belge",
    emptyDocument: "Boş belge",
    words: "kelime",
    branches: "dal",
    justNow: "az önce",
    minutesAgo: "{count} dk önce",
    hoursAgo: "{count} saat önce",
    daysAgo: "{count} gün önce",
    language: "Dil",
  },
  de: {
    library: "Dokumentbibliothek",
    close: "Schließen",
    search: "Dokumente suchen…",
    openFile: "Datei öffnen",
    newDocument: "Neues Dokument",
    noMatches: "Keine Dokumente entsprechen der Suche.",
    emptyLibrary: "Noch keine Dokumente. Erstelle ein Dokument oder öffne eine Datei.",
    deleteDocument: "Dokument löschen",
    unnamed: "Unbenanntes Dokument",
    emptyDocument: "Leeres Dokument",
    words: "Wörter",
    branches: "Zweige",
    justNow: "gerade eben",
    minutesAgo: "vor {count} Min.",
    hoursAgo: "vor {count} Std.",
    daysAgo: "vor {count} Tagen",
    language: "Sprache",
  },
  es: {
    library: "Biblioteca de documentos",
    close: "Cerrar",
    search: "Buscar documentos…",
    openFile: "Abrir archivo",
    newDocument: "Nuevo documento",
    noMatches: "Ningún documento coincide con la búsqueda.",
    emptyLibrary: "Aún no hay documentos. Crea uno nuevo o abre un archivo.",
    deleteDocument: "Eliminar documento",
    unnamed: "Documento sin título",
    emptyDocument: "Documento vacío",
    words: "palabras",
    branches: "ramas",
    justNow: "ahora mismo",
    minutesAgo: "hace {count} min",
    hoursAgo: "hace {count} h",
    daysAgo: "hace {count} días",
    language: "Idioma",
  },
};

function browserLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const candidate = navigator.language.slice(0, 2) as Locale;
  return SUPPORTED_LOCALES.includes(candidate) ? candidate : DEFAULT_LOCALE;
}

export function loadLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const stored = window.localStorage.getItem(LOCALE_KEY) as Locale | null;
    return stored && SUPPORTED_LOCALES.includes(stored) ? stored : browserLocale();
  } catch {
    return browserLocale();
  }
}

export function saveLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    // Private browsing and blocked storage should not break writing.
  }
}

export function translate(
  locale: Locale,
  key: string,
  values?: Record<string, string | number>,
): string {
  const template = messages[locale][key] ?? messages[DEFAULT_LOCALE][key] ?? key;
  return Object.entries(values ?? {}).reduce(
    (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
    template,
  );
}

export function formatRelativeTime(timestamp: number, locale: Locale, now = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - timestamp) / 60_000));
  if (minutes < 1) return translate(locale, "justNow");
  if (minutes < 60) return translate(locale, "minutesAgo", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return translate(locale, "hoursAgo", { count: hours });
  return translate(locale, "daysAgo", { count: Math.floor(hours / 24) });
}

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  useEffect(() => {
    const detected = loadLocale();
    setLocaleState(detected);
    document.documentElement.lang = detected;
    document.documentElement.dir = ["ar", "fa", "he", "ur"].includes(detected) ? "rtl" : "ltr";
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = ["ar", "fa", "he", "ur"].includes(locale) ? "rtl" : "ltr";
  }, [locale]);
  const setLocale = useCallback((next: Locale) => {
    saveLocale(next);
    setLocaleState(next);
  }, []);
  const t = useCallback(
    (key: string, values?: Record<string, string | number>) => translate(locale, key, values),
    [locale],
  );
  return { locale, setLocale, t };
}

export function localeLabel(locale: Locale): string {
  return new Intl.DisplayNames([locale], { type: "language" }).of(locale) ?? locale;
}

export type { Messages };
export { DEFAULT_LOCALE };
