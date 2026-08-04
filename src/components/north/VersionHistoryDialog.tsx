import { useCallback, useEffect, useState } from "react";
import { History, RotateCcw, Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { clearVersions, deleteVersion, listVersions, type Version } from "@/lib/north/history";
import { sanitizeHtml } from "@/lib/north/sanitize";

interface VersionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docId: string;
  onRestore: (html: string) => void;
}

function formatStamp(ms: number): string {
  return new Date(ms).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function preview(html: string): string {
  const text = sanitizeHtml(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 160 ? `${text.slice(0, 160)}…` : text;
}

/** Local version history: restore, delete or clear snapshots of this document. */
export function VersionHistoryDialog({
  open,
  onOpenChange,
  docId,
  onRestore,
}: VersionHistoryDialogProps) {
  const [versions, setVersions] = useState<Version[]>([]);

  const refresh = useCallback(() => setVersions(listVersions(docId)), [docId]);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4" aria-hidden="true" />
            Sürüm geçmişi
          </DialogTitle>
          <DialogDescription>
            Anlık görüntüler yalnızca bu cihazda saklanır. Bir sürümü geri yüklediğinde mevcut metin
            önce yeni bir sürüm olarak kaydedilir.
          </DialogDescription>
        </DialogHeader>

        {versions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Henüz kayıtlı sürüm yok. Yazmaya devam ettikçe otomatik olarak oluşturulur.
          </p>
        ) : (
          <ul className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
            {versions.map((version) => (
              <li
                key={version.id}
                className="rounded-lg border border-border bg-card/60 p-3 transition-colors hover:bg-accent/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {formatStamp(version.createdAt)}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {version.branch} · {version.words} kelime · {version.label}
                      </span>
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {preview(version.html)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        onRestore(version.html);
                        onOpenChange(false);
                      }}
                    >
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                      Geri yükle
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Bu sürümü sil"
                      onClick={() => {
                        deleteVersion(docId, version.id);
                        refresh();
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {versions.length > 0 && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => {
                clearVersions(docId);
                refresh();
              }}
            >
              Tüm geçmişi temizle
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
