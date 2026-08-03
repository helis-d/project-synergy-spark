import { useEffect, useRef, useState } from "react";
import { Globe, Hash } from "lucide-react";

interface LinkPopupProps {
  position: { x: number; y: number } | null;
  headings: string[];
  onApply: (href: string) => void;
  onClose: () => void;
}

export function LinkPopup({ position, headings, onApply, onClose }: LinkPopupProps) {
  const [mode, setMode] = useState<"root" | "web" | "internal">("root");
  const [url, setUrl] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMode("root");
    setUrl("");
  }, [position]);

  useEffect(() => {
    if (!position) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [position, onClose]);

  if (!position) return null;

  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;
  const left = Math.min(Math.max(12, position.x), Math.max(12, vw - 260));
  const top = Math.min(position.y, vh - 180);

  return (
    <div
      ref={containerRef}
      style={{ left, top }}
      className="fixed z-50 w-60 rounded-lg border border-line bg-panel p-1.5 shadow-panel"
      role="dialog"
      aria-label="Bağlantı ekle"
    >
      {mode === "root" && (
        <>
          <button
            type="button"
            onClick={() => setMode("web")}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] text-ink hover:bg-secondary"
          >
            <Globe className="h-4 w-4" /> Web linki ekle
          </button>
          <button
            type="button"
            onClick={() => setMode("internal")}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] text-ink hover:bg-secondary"
          >
            <Hash className="h-4 w-4" /> Belgedeki bir başlığa bağla
          </button>
        </>
      )}

      {mode === "web" && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const value = url.trim();
            if (!value) return;
            onApply(/^https?:\/\//i.test(value) ? value : `https://${value}`);
          }}
        >
          <input
            autoFocus
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://..."
            inputMode="url"
            className="w-full rounded-md border border-line bg-background px-2 py-2 text-[13px] text-ink outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="mt-1.5 w-full rounded-md bg-primary px-2 py-2 text-[13px] text-primary-foreground"
          >
            Bağla
          </button>
        </form>
      )}

      {mode === "internal" && (
        <div className="north-scroll max-h-56 overflow-y-auto">
          {headings.length === 0 ? (
            <p className="px-2.5 py-2 text-xs text-ink-dim">Belgede başlık yok.</p>
          ) : (
            headings.map((heading) => (
              <button
                key={heading}
                type="button"
                onClick={() => onApply(`#${encodeURIComponent(heading)}`)}
                className="block w-full truncate rounded-md px-2.5 py-1.5 text-left text-[12.5px] text-ink hover:bg-secondary"
              >
                ↳ {heading}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
