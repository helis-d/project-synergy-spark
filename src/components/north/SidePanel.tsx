import { Mic, Square, X, Clock, Download, Trash2 } from "lucide-react";
import { THEME_LABELS, formatHour, type ThemeName } from "@/lib/north/theme";

interface SidePanelProps {
  open: boolean;
  theme: ThemeName;
  hour: number;
  autoTime: boolean;
  dictationSupported: boolean;
  listening: boolean;
  finalText: string;
  interimText: string;
  diff: { added: string[]; removed: string[] } | null;
  activeBranch: string;
  onClose: () => void;
  onToggleDictation: () => void;
  onClearDictation: () => void;
  onHourChange: (hour: number) => void;
  onAutoTimeChange: (auto: boolean) => void;
  onExport: () => void;
  onReset: () => void;
}

export function SidePanel({
  open,
  theme,
  hour,
  autoTime,
  dictationSupported,
  listening,
  finalText,
  interimText,
  diff,
  activeBranch,
  onClose,
  onToggleDictation,
  onClearDictation,
  onHourChange,
  onAutoTimeChange,
  onExport,
  onReset,
}: SidePanelProps) {
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Paneli kapat"
          onClick={onClose}
          className="fixed inset-0 z-20 bg-background/60 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside
        className={`north-scroll fixed top-14 right-0 bottom-0 z-30 w-[82vw] max-w-88 overflow-y-auto border-l border-line bg-panel px-3 py-4 transition-transform duration-250 lg:static lg:top-0 lg:z-0 lg:w-auto lg:max-w-none lg:translate-x-0 ${
          open ? "translate-x-0 shadow-panel" : "translate-x-[110%]"
        }`}
      >
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="text-[11px] tracking-widest text-ink-dim uppercase">Sesli Yazdırma</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-ink-dim hover:bg-secondary lg:hidden"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          disabled={!dictationSupported}
          onClick={onToggleDictation}
          className={`flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-3 text-[13px] font-medium transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
            listening
              ? "border-destructive bg-destructive text-destructive-foreground shadow-panel"
              : "border-line bg-secondary text-ink hover:bg-background"
          }`}
        >
          {listening ? (
            <>
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-current" />
              </span>
              <Square className="h-4 w-4" />
            </>
          ) : (
            <Mic className="h-4 w-4" />
          )}
          {!dictationSupported
            ? "Bu tarayıcı sesli girişi desteklemiyor"
            : listening
              ? "Dinleniyor — durdur ve ekle"
              : "Dikteyi başlat"}
        </button>

        <div className="mt-2.5 min-h-16 rounded-lg border border-dashed border-line p-2.5 text-[13px] leading-relaxed text-ink-dim">
          {finalText || interimText ? (
            <>
              <span className="text-ink">{finalText}</span>
              <span className="opacity-50">{interimText}</span>
            </>
          ) : (
            "Konuşma burada belirir — duraklamalar noktalamaya dönüşür."
          )}
        </div>
        {(finalText || interimText) && !listening && (
          <button
            type="button"
            onClick={onClearDictation}
            className="mt-2 text-[11px] text-ink-dim underline hover:text-ink"
          >
            önizlemeyi temizle
          </button>
        )}

        <h2 className="mt-6 mb-1 text-[11px] tracking-widest text-ink-dim uppercase">
          Dal Karşılaştırma
        </h2>
        <p className="mb-2 flex items-center gap-1.5 text-[11px] text-ink-dim">
          <span className="rounded bg-secondary px-1.5 py-0.5 font-medium text-ink">
            {activeBranch}
          </span>
          ↔
          <span className="rounded bg-secondary px-1.5 py-0.5">main</span>
        </p>
        <div className="north-card p-2.5 font-mono text-[12.5px] leading-relaxed break-words">
          {!diff ? (
            "Ana dal seçili — karşılaştırma için bir dal aç."
          ) : diff.added.length === 0 && diff.removed.length === 0 ? (
            "Fark bulunamadı."
          ) : (
            <>
              {diff.removed.map((word, i) => (
                <span
                  key={`del-${i}-${word}`}
                  className="mr-1 rounded bg-destructive/25 px-0.5 line-through"
                >
                  {word}
                </span>
              ))}
              {diff.added.map((word, i) => (
                <span key={`add-${i}-${word}`} className="mr-1 rounded bg-success/25 px-0.5">
                  {word}
                </span>
              ))}
            </>
          )}
        </div>

        <h2 className="mt-6 mb-2 flex items-center gap-1.5 text-[11px] tracking-widest text-ink-dim uppercase">
          <Clock className="h-3.5 w-3.5" /> Zaman / Tema
        </h2>
        <div className="north-card p-3">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="font-mono text-[15px] text-ink">{formatHour(hour)}</span>
            <span className="text-[11px] tracking-widest text-ink-dim uppercase">
              {THEME_LABELS[theme]}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={23}
            step={1}
            value={hour}
            onChange={(event) => onHourChange(Number(event.target.value))}
            aria-label="Tema saati"
            className="north-range"
            style={{ ["--fill" as string]: `${(hour / 23) * 100}%` }}
          />
          <label className="mt-3 flex items-center gap-2 text-xs text-ink-dim">
            <input
              type="checkbox"
              checked={autoTime}
              onChange={(event) => onAutoTimeChange(event.target.checked)}
              className="h-3.5 w-3.5 accent-primary"
            />
            cihaz saatini otomatik izle
          </label>
        </div>

        <h2 className="mt-6 mb-2 text-[11px] tracking-widest text-ink-dim uppercase">Belge</h2>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onExport}
            className="flex items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-[13px] text-ink transition-all hover:bg-secondary active:scale-[0.98]"
          >
            <Download className="h-4 w-4" /> Markdown indir
          </button>
          <button
            type="button"
            onClick={onReset}
            className="flex items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-[13px] text-ink-dim transition-all hover:bg-secondary hover:text-destructive active:scale-[0.98]"
          >
            <Trash2 className="h-4 w-4" /> Belgeyi sıfırla
          </button>
        </div>

      </aside>
    </>
  );
}
