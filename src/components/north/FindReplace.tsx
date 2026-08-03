import { useEffect, useRef, useState } from "react";
import { Search, Replace, X, ChevronUp, ChevronDown } from "lucide-react";

interface FindReplaceProps {
  open: boolean;
  onClose: () => void;
  editorRef: React.RefObject<HTMLDivElement | null>;
  onCommit: () => void;
}

export function FindReplace({ open, onClose, editorRef, onCommit }: FindReplaceProps) {
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [showReplace, setShowReplace] = useState(false);
  const rangesRef = useRef<Range[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const clearHighlights = () => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.querySelectorAll("mark.north-find").forEach((m) => {
      const parent = m.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(m.textContent ?? ""), m);
      parent.normalize();
    });
  };

  const performSearch = (query: string) => {
    clearHighlights();
    rangesRef.current = [];
    setMatchCount(0);
    setCurrentIndex(-1);
    if (!query.trim() || !editorRef.current) return;

    const editor = editorRef.current;
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.tagName === "MARK" && parent.classList.contains("north-find"))
          return NodeFilter.FILTER_REJECT;
        if (parent.tagName === "SCRIPT" || parent.tagName === "STYLE")
          return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const lowerQuery = query.toLowerCase();
    const matches: Range[] = [];

    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      const text = node.textContent ?? "";
      const lower = text.toLowerCase();
      let pos = 0;
      while (true) {
        const idx = lower.indexOf(lowerQuery, pos);
        if (idx === -1) break;
        const range = document.createRange();
        range.setStart(node, idx);
        range.setEnd(node, idx + query.length);
        matches.push(range);
        pos = idx + query.length;
      }
    }

    matches.forEach((range) => {
      const mark = document.createElement("mark");
      mark.className = "north-find";
      mark.style.backgroundColor = "oklch(0.82 0.14 85)";
      mark.style.color = "inherit";
      try {
        range.surroundContents(mark);
      } catch {
        /* boundary-spanning match — skip */
      }
    });

    rangesRef.current = matches;
    setMatchCount(matches.length);
    if (matches.length > 0) {
      setCurrentIndex(0);
      scrollToMatch(0);
    }
  };

  const scrollToMatch = (index: number) => {
    const range = rangesRef.current[index];
    if (!range) return;
    const marks = editorRef.current?.querySelectorAll<HTMLElement>("mark.north-find");
    const mark = marks?.[index];
    if (mark) {
      mark.style.backgroundColor = "oklch(0.72 0.18 50)";
      marks?.forEach((m, i) => {
        if (i !== index) m.style.backgroundColor = "oklch(0.82 0.14 85)";
      });
      mark.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const next = () => {
    if (rangesRef.current.length === 0) return;
    const ni = (currentIndex + 1) % rangesRef.current.length;
    setCurrentIndex(ni);
    scrollToMatch(ni);
  };

  const prev = () => {
    if (rangesRef.current.length === 0) return;
    const ni = (currentIndex - 1 + rangesRef.current.length) % rangesRef.current.length;
    setCurrentIndex(ni);
    scrollToMatch(ni);
  };

  const replaceOne = () => {
    if (currentIndex < 0 || !rangesRef.current[currentIndex]) return;
    const range = rangesRef.current[currentIndex];
    range.deleteContents();
    range.insertNode(document.createTextNode(replace));
    onCommit();
    performSearch(find);
  };

  const replaceAll = () => {
    if (!find.trim()) return;
    const editor = editorRef.current;
    if (!editor) return;
    const html = editor.innerHTML;
    const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "gi");
    const newHtml = html.replace(regex, replace);
    editor.innerHTML = newHtml;
    onCommit();
    clearHighlights();
    rangesRef.current = [];
    setMatchCount(0);
    setCurrentIndex(-1);
  };

  useEffect(() => {
    if (!open) {
      clearHighlights();
      setFind("");
      setReplace("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) prev();
        else if (showReplace) replaceOne();
        else next();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, showReplace, currentIndex, find, replace]);

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      className="fixed right-4 top-16 z-50 w-80 rounded-lg border border-line bg-panel p-3 shadow-panel"
      role="dialog"
      aria-label="Bul ve Değiştir"
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-ink">Bul</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-ink-dim hover:bg-secondary"
          aria-label="Kapat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-dim" />
          <input
            autoFocus
            value={find}
            onChange={(e) => {
              setFind(e.target.value);
              performSearch(e.target.value);
            }}
            placeholder="Aranan metin"
            className="w-full rounded-md border border-line bg-background py-1.5 pl-8 pr-3 text-[13px] text-ink outline-none focus:border-primary"
          />
        </div>
        <button
          type="button"
          onClick={prev}
          disabled={matchCount === 0}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-dim hover:bg-secondary disabled:opacity-40"
          aria-label="Önceki"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={next}
          disabled={matchCount === 0}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-dim hover:bg-secondary disabled:opacity-40"
          aria-label="Sonraki"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {matchCount > 0 && (
        <p className="mt-1 text-[11px] text-ink-dim">
          {currentIndex + 1} / {matchCount} eşleşme
        </p>
      )}

      <button
        type="button"
        onClick={() => setShowReplace((s) => !s)}
        className="mt-2 flex items-center gap-1.5 text-[11px] text-primary hover:underline"
      >
        <Replace className="h-3 w-3" />
        {showReplace ? "Değiştirmeyi gizle" : "Değiştir"}
      </button>

      {showReplace && (
        <div className="mt-1.5 space-y-1.5">
          <input
            value={replace}
            onChange={(e) => setReplace(e.target.value)}
            placeholder="Yeni metin"
            className="w-full rounded-md border border-line bg-background px-2.5 py-1.5 text-[13px] text-ink outline-none focus:border-primary"
          />
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={replaceOne}
              disabled={matchCount === 0}
              className="flex-1 rounded-md border border-line py-1.5 text-[12px] text-ink hover:bg-secondary disabled:opacity-40"
            >
              Değiştir
            </button>
            <button
              type="button"
              onClick={replaceAll}
              disabled={matchCount === 0}
              className="flex-1 rounded-md bg-primary py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              Tümünü değiştir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
