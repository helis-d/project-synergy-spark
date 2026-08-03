import { useEffect, useState } from "react";
import { X, Printer, FileDown } from "lucide-react";

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

interface PageSettingsDialogProps {
  open: boolean;
  settings: PageSettings;
  onSave: (settings: PageSettings) => void;
  onClose: () => void;
  onPrint: () => void;
}

export function PageSettingsDialog({
  open,
  settings,
  onSave,
  onClose,
  onPrint,
}: PageSettingsDialogProps) {
  const [draft, setDraft] = useState<PageSettings>(settings);

  useEffect(() => {
    if (open) setDraft(settings);
  }, [open, settings]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const update = <K extends keyof PageSettings>(key: K, value: PageSettings[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const updateMargin = (key: keyof PageSettings["margins"], value: number) => {
    setDraft((prev) => ({ ...prev, margins: { ...prev.margins, [key]: value } }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <div
        className="w-[28rem] max-w-[92vw] rounded-xl border border-line bg-panel p-5 shadow-panel"
        role="dialog"
        aria-label="Sayfa yapısı"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-ink">Sayfa Yapısı</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-ink-dim hover:bg-secondary"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-ink-dim">
              Sayfa boyutu
            </label>
            <div className="flex gap-2">
              {(["a4", "letter"] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => update("size", size)}
                  className={`rounded-md border px-3 py-1.5 text-[13px] transition-colors ${
                    draft.size === size
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-line text-ink hover:bg-secondary"
                  }`}
                >
                  {size === "a4" ? "A4" : "Letter"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-ink-dim">
              Yön
            </label>
            <div className="flex gap-2">
              {(["portrait", "landscape"] as const).map((orientation) => (
                <button
                  key={orientation}
                  type="button"
                  onClick={() => update("orientation", orientation)}
                  className={`rounded-md border px-3 py-1.5 text-[13px] transition-colors ${
                    draft.orientation === orientation
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-line text-ink hover:bg-secondary"
                  }`}
                >
                  {orientation === "portrait" ? "Dikey" : "Yatay"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-ink-dim">
              Kenar boşlukları (mm)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {([
                { key: "top", label: "Üst" },
                { key: "bottom", label: "Alt" },
                { key: "left", label: "Sol" },
                { key: "right", label: "Sağ" },
              ] as const).map((m) => (
                <div key={m.key}>
                  <span className="mb-0.5 block text-[10px] text-ink-dim">{m.label}</span>
                  <input
                    type="number"
                    min={5}
                    max={50}
                    value={draft.margins[m.key]}
                    onChange={(e) => updateMargin(m.key, Number(e.target.value))}
                    className="w-full rounded-md border border-line bg-background px-2 py-1 text-[13px] text-ink outline-none focus:border-primary"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-ink-dim">
              Sütunlar
            </label>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => update("columns", n)}
                  className={`rounded-md border px-3 py-1.5 text-[13px] transition-colors ${
                    draft.columns === n
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-line text-ink hover:bg-secondary"
                  }`}
                >
                  {n} sütun
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 border-t border-line pt-3">
            <label className="flex items-center gap-2 text-[13px] text-ink">
              <input
                type="checkbox"
                checked={draft.showHeader}
                onChange={(e) => update("showHeader", e.target.checked)}
                className="h-3.5 w-3.5 accent-primary"
              />
              Üst bilgi (Header)
            </label>
            {draft.showHeader && (
              <input
                value={draft.headerText}
                onChange={(e) => update("headerText", e.target.value)}
                placeholder="Üst bilgi metni"
                className="w-full rounded-md border border-line bg-background px-2.5 py-1.5 text-[13px] text-ink outline-none focus:border-primary"
              />
            )}
            <label className="flex items-center gap-2 text-[13px] text-ink">
              <input
                type="checkbox"
                checked={draft.showFooter}
                onChange={(e) => update("showFooter", e.target.checked)}
                className="h-3.5 w-3.5 accent-primary"
              />
              Alt bilgi (Footer)
            </label>
            {draft.showFooter && (
              <input
                value={draft.footerText}
                onChange={(e) => update("footerText", e.target.value)}
                placeholder="Alt bilgi metni"
                className="w-full rounded-md border border-line bg-background px-2.5 py-1.5 text-[13px] text-ink outline-none focus:border-primary"
              />
            )}
            <label className="flex items-center gap-2 text-[13px] text-ink">
              <input
                type="checkbox"
                checked={draft.showPageNumbers}
                onChange={(e) => update("showPageNumbers", e.target.checked)}
                className="h-3.5 w-3.5 accent-primary"
              />
              Sayfa numaraları
            </label>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              onSave(draft);
              onPrint();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-[13px] text-ink hover:bg-secondary"
          >
            <Printer className="h-4 w-4" /> Yazdır / PDF
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(draft);
              onClose();
            }}
            className="flex-1 rounded-lg bg-primary py-2 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
