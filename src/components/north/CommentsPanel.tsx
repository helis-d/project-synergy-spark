import { useEffect, useState } from "react";
import { X, MessageSquare, Trash2, Check } from "lucide-react";

export interface Comment {
  id: string;
  text: string;
  author: string;
  createdAt: number;
  resolved: boolean;
  anchorText: string;
}

interface CommentsPanelProps {
  open: boolean;
  comments: Comment[];
  onClose: () => void;
  onAdd: (text: string) => void;
  onDelete: (id: string) => void;
  onResolve: (id: string) => void;
}

export function CommentsPanel({
  open,
  comments,
  onClose,
  onAdd,
  onDelete,
  onResolve,
}: CommentsPanelProps) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!open) setText("");
  }, [open]);

  if (!open) return null;

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const min = Math.floor(diff / 60_000);
    if (min < 1) return "az önce";
    if (min < 60) return `${min} dk önce`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} saat önce`;
    return new Date(ts).toLocaleDateString("tr-TR");
  };

  return (
    <div className="fixed right-0 top-14 bottom-0 z-40 w-[20rem] max-w-[85vw] border-l border-line bg-panel p-3 shadow-panel">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
          <MessageSquare className="h-4 w-4" /> Yorumlar
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-ink-dim hover:bg-secondary"
          aria-label="Kapat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="north-scroll mb-3 max-h-[calc(100dvh-16rem)] space-y-2 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="py-8 text-center text-[12px] text-ink-dim">
            Henüz yorum yok. Metni seçip yorum ekleyin.
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`rounded-lg border p-2.5 text-[12.5px] ${
                comment.resolved
                  ? "border-success/30 bg-success/5 opacity-70"
                  : "border-line bg-secondary/40"
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="font-medium text-ink">{comment.author}</span>
                <span className="text-[10px] text-ink-dim">{formatTime(comment.createdAt)}</span>
              </div>
              {comment.anchorText && (
                <p className="mb-1.5 truncate rounded bg-secondary px-1.5 py-0.5 text-[11px] italic text-ink-dim">
                  "{comment.anchorText}"
                </p>
              )}
              <p className="text-ink">{comment.text}</p>
              <div className="mt-1.5 flex gap-2">
                <button
                  type="button"
                  onClick={() => onResolve(comment.id)}
                  className="inline-flex items-center gap-1 text-[10px] text-success hover:underline"
                >
                  <Check className="h-3 w-3" />
                  {comment.resolved ? "Çözüldü" : "Çöz"}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(comment.id)}
                  className="inline-flex items-center gap-1 text-[10px] text-destructive hover:underline"
                >
                  <Trash2 className="h-3 w-3" /> Sil
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-2 border-t border-line pt-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Yorum yaz…"
          rows={3}
          className="w-full resize-none rounded-md border border-line bg-background px-2.5 py-2 text-[13px] text-ink outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={() => {
            if (text.trim()) {
              onAdd(text.trim());
              setText("");
            }
          }}
          disabled={!text.trim()}
          className="w-full rounded-md bg-primary py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
        >
          Yorum ekle
        </button>
      </div>
    </div>
  );
}
