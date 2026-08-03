import { useEffect, useState } from "react";
import { Download, X, FileText } from "lucide-react";
import type { NorthDoc } from "@/lib/north/storage";
import type { ExportFormat } from "@/lib/north/fileio";
import { exportDoc, getFormatLabel } from "@/lib/north/fileio";

interface ExitDialogProps {
  open: boolean;
  doc: NorthDoc | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const FORMATS: ExportFormat[] = ["nh", "md", "html", "txt"];

export function ExitDialog({ open, doc, onConfirm, onCancel }: ExitDialogProps) {
  const [selected, setSelected] = useState<ExportFormat>("nh");
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected("nh");
      setDownloaded(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open || !doc) return null;

  const handleDownload = () => {
    exportDoc(doc, selected);
    setDownloaded(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm">
      <div className="north-paper w-full max-w-sm p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-serif text-lg font-bold">
            <Download className="h-5 w-5 text-primary" /> Belgeni indir
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1 text-ink-dim hover:bg-secondary"
            aria-label="Kapat"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <p className="mb-4 text-[13px] leading-relaxed text-ink-dim">
          Çıkmadan önce <span className="font-medium text-ink">"{doc.title}"</span> belgesini
          indirmek ister misin?
        </p>

        <div className="mb-4 flex flex-col gap-1.5">
          {FORMATS.map((format) => (
            <button
              key={format}
              type="button"
              onClick={() => {
                setSelected(format);
                setDownloaded(false);
              }}
              className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-all ${
                selected === format
                  ? "border-primary bg-primary/10 text-ink"
                  : "border-line text-ink-dim hover:bg-secondary"
              }`}
            >
              <FileText className="h-4 w-4 shrink-0" />
              {getFormatLabel(format)}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-dim transition-colors hover:bg-secondary"
          >
            İndirme
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-95"
          >
            <Download className="h-4 w-4" />
            {downloaded ? "Tekrar indir" : "İndir ve çık"}
          </button>
        </div>
      </div>
    </div>
  );
}
