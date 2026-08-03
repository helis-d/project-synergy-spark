import { useMemo, useRef, useState } from "react";
import { FileText, Plus, Trash2, Upload, Clock, X, Search } from "lucide-react";
import type { NorthDoc } from "@/lib/north/storage";
import { countWords } from "@/lib/north/markdown";
import { sanitizeHtml } from "@/lib/north/sanitize";

interface DocumentLibraryProps {
  docs: NorthDoc[];
  activeId: string | null;
  onOpen: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onImport: (files: FileList) => void;
  onClose: () => void;
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "az önce";
  if (min < 60) return `${min} dk önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} saat önce`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day} gün önce`;
  return new Date(ts).toLocaleDateString("tr-TR");
}

function previewText(html: string): string {
  if (typeof document === "undefined") {
    return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  }
  const div = document.createElement("div");
  div.innerHTML = sanitizeHtml(html);
  return (div.innerText ?? "").replace(/\s+/g, " ").trim();
}

export function DocumentLibrary({
  docs,
  activeId,
  onOpen,
  onCreate,
  onDelete,
  onImport,
  onClose,
}: DocumentLibraryProps) {
  const [query, setQuery] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return docs;
    const q = query.toLowerCase();
    return docs.filter((d) => d.title.toLowerCase().includes(q));
  }, [docs, query]);

  return (
    <div className="north-scroll flex h-[100dvh] flex-col overflow-y-auto bg-background">
      <header className="flex shrink-0 items-center justify-between border-b border-line bg-panel/95 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/20" />
          <h1 className="font-serif text-xl font-bold tracking-wide">Belge Kitaplığı</h1>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-dim transition-colors hover:bg-secondary"
          aria-label="Kapat"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex flex-col gap-3 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Belge ara…"
              className="w-full rounded-lg border border-line bg-card py-2.5 pl-9 pr-3 text-sm text-ink outline-none focus:border-primary"
            />
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-secondary active:scale-95"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Dosya aç</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".nh,.json,.md,.markdown,.html,.htm,.txt"
            multiple
            className="sr-only"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) onImport(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Yeni belge</span>
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line py-16 text-center">
            <FileText className="h-10 w-10 text-ink-dim opacity-50" />
            <p className="text-sm text-ink-dim">
              {query.trim()
                ? "Aramanla eşleşen belge yok."
                : "Henüz belge yok. Yeni bir belge oluştur veya dosya aç."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((doc) => {
              const branchHtml = doc.branches[doc.activeBranch]?.html ?? "";
              const preview = previewText(branchHtml);
              const words = countWords(preview);
              const branchCount = Object.keys(doc.branches).length;
              const isActive = doc.id === activeId;

              return (
                <div
                  key={doc.id}
                  className={`group north-paper relative flex cursor-pointer flex-col gap-2 p-4 transition-all hover:shadow-lg ${
                    isActive ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => onOpen(doc.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="min-w-0 flex-1 truncate font-serif text-base font-semibold text-ink">
                      {doc.title || "Adsız belge"}
                    </h3>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(doc.id);
                      }}
                      className="shrink-0 rounded-md p-1 text-ink-dim opacity-0 transition-opacity hover:bg-destructive/15 hover:text-destructive group-hover:opacity-100"
                      aria-label="Belgeyi sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="line-clamp-3 min-h-[3.6em] text-[13px] leading-relaxed text-ink-dim">
                    {preview || "Boş belge"}
                  </p>
                  <div className="mt-auto flex items-center gap-3 pt-2 text-[11px] text-ink-dim">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelative(doc.updatedAt)}
                    </span>
                    <span>{words} kelime</span>
                    {branchCount > 1 && <span>{branchCount} dal</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
