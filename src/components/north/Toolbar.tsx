import { useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link2,
  Sparkles,
  Code2,
  Menu,
  PanelRight,
  Undo2,
  Redo2,
  Check,
  Loader2,
} from "lucide-react";
import { THEME_LABELS, type ThemeName } from "@/lib/north/theme";

interface ToolbarProps {
  theme: ThemeName;
  flowEnabled: boolean;
  mdMode: boolean;
  saved: boolean;
  onCommand: (command: string, value?: string) => void;
  onBlock: (tag: string) => void;
  onToggleFlow: () => void;
  onToggleMd: () => void;
  onLink: () => void;
  onToggleOutline: () => void;
  onToggleSide: () => void;
}

const iconButton =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink transition-all hover:bg-background/70 active:scale-90";
const textButton =
  "inline-flex h-8 shrink-0 items-center justify-center rounded-md px-2 text-[12.5px] font-semibold text-ink transition-all hover:bg-background/70 active:scale-90";
const activeButton = "bg-card text-ink shadow-sm ring-1 ring-line";

const INLINE_COMMANDS = ["bold", "italic", "underline", "strikeThrough"] as const;

export function Toolbar({
  theme,
  flowEnabled,
  mdMode,
  saved,
  onCommand,
  onBlock,
  onToggleFlow,
  onToggleMd,
  onLink,
  onToggleOutline,
  onToggleSide,
}: ToolbarProps) {
  const [marks, setMarks] = useState<Record<string, boolean>>({});
  const [block, setBlock] = useState("P");

  useEffect(() => {
    const sync = () => {
      try {
        const next: Record<string, boolean> = {};
        for (const command of INLINE_COMMANDS) next[command] = document.queryCommandState(command);
        next.insertUnorderedList = document.queryCommandState("insertUnorderedList");
        next.insertOrderedList = document.queryCommandState("insertOrderedList");
        setMarks(next);
        const value = (document.queryCommandValue("formatBlock") || "p").toString().toUpperCase();
        setBlock(value);
      } catch {
        /* selection outside a formattable node */
      }
    };
    document.addEventListener("selectionchange", sync);
    return () => document.removeEventListener("selectionchange", sync);
  }, []);

  const markClass = (command: string) => `${iconButton} ${marks[command] ? activeButton : ""}`;

  return (
    <header className="col-span-full grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-line bg-panel/95 px-2 backdrop-blur-sm sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onToggleOutline}
          className={`${iconButton} h-9 w-9 lg:hidden`}
          aria-label="Taslak panelini aç"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>
        <div className="hidden items-center gap-2 pr-1 sm:flex">
          <span className="h-2 w-2 shrink-0 rounded-full bg-primary ring-4 ring-primary/20" />
          <span className="font-serif text-[17px] font-bold tracking-wide">North</span>
        </div>
      </div>

      <div className="north-scroll flex min-w-0 items-center gap-1.5 overflow-x-auto py-2">
        <div className="north-group">
          <button
            type="button"
            className={iconButton}
            onClick={() => onCommand("undo")}
            title="Geri al"
            aria-label="Geri al"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={iconButton}
            onClick={() => onCommand("redo")}
            title="İleri al"
            aria-label="İleri al"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        <div className="north-group">
          <button
            type="button"
            className={markClass("bold")}
            aria-pressed={!!marks.bold}
            onClick={() => onCommand("bold")}
            title="Kalın (⌘B)"
            aria-label="Kalın"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={markClass("italic")}
            aria-pressed={!!marks.italic}
            onClick={() => onCommand("italic")}
            title="İtalik (⌘I)"
            aria-label="İtalik"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={markClass("underline")}
            aria-pressed={!!marks.underline}
            onClick={() => onCommand("underline")}
            title="Altı çizili (⌘U)"
            aria-label="Altı çizili"
          >
            <Underline className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={markClass("strikeThrough")}
            aria-pressed={!!marks.strikeThrough}
            onClick={() => onCommand("strikeThrough")}
            title="Üstü çizili"
            aria-label="Üstü çizili"
          >
            <Strikethrough className="h-4 w-4" />
          </button>
        </div>

        <div className="north-group">
          {["H1", "H2", "H3"].map((tag) => (
            <button
              key={tag}
              type="button"
              className={`${textButton} ${block === tag ? activeButton : ""}`}
              aria-pressed={block === tag}
              onClick={() => onBlock(tag)}
              title={`${tag} başlık`}
            >
              {tag}
            </button>
          ))}
          <button
            type="button"
            className={`${textButton} ${block === "P" || block === "DIV" ? activeButton : ""}`}
            onClick={() => onBlock("P")}
            title="Paragraf"
          >
            ¶
          </button>
          <button
            type="button"
            className={`${iconButton} ${block === "BLOCKQUOTE" ? activeButton : ""}`}
            onClick={() => onBlock("BLOCKQUOTE")}
            title="Alıntı"
            aria-label="Alıntı"
          >
            <Quote className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={markClass("insertUnorderedList")}
            onClick={() => onCommand("insertUnorderedList")}
            title="Madde listesi"
            aria-label="Madde listesi"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={markClass("insertOrderedList")}
            onClick={() => onCommand("insertOrderedList")}
            title="Numaralı liste"
            aria-label="Numaralı liste"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
        </div>

        <div className="north-group">
          <select
            aria-label="Yazı tipi"
            defaultValue="serif"
            onChange={(event) => {
              const map: Record<string, string> = {
                serif: "'Source Serif 4', serif",
                sans: "'Inter', sans-serif",
                mono: "'JetBrains Mono', monospace",
              };
              onCommand("fontName", map[event.target.value]);
            }}
            className="h-8 shrink-0 rounded-md border border-line bg-card px-1.5 text-[12.5px] text-ink"
          >
            <option value="serif">Serif</option>
            <option value="sans">Sans</option>
            <option value="mono">Mono</option>
          </select>
          <label className={`${iconButton} cursor-pointer`} aria-label="Metin rengi" title="Metin rengi">
            <span className="h-4 w-4 rounded-full border border-line bg-linear-to-br from-primary to-accent" />
            <input
              type="color"
              className="sr-only"
              onChange={(event) => onCommand("foreColor", event.target.value)}
            />
          </label>
          <button
            type="button"
            className={iconButton}
            onClick={onLink}
            title="Bağlantı ekle"
            aria-label="Bağlantı ekle"
          >
            <Link2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToggleMd}
            aria-pressed={mdMode}
            className={`${iconButton} ${mdMode ? "bg-primary text-primary-foreground hover:bg-primary" : ""}`}
            title="Markdown görünümü"
            aria-label="Markdown görünümü"
          >
            <Code2 className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onToggleFlow}
          aria-pressed={flowEnabled}
          title="Akış modu — yazdıkça devam önerisi"
          className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition-all active:scale-95 ${
            flowEnabled
              ? "bg-primary text-primary-foreground shadow-sm"
              : "border border-line text-ink hover:bg-secondary"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Akış</span>
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span
          className="hidden items-center gap-1.5 text-[11px] text-ink-dim sm:inline-flex"
          aria-live="polite"
        >
          {saved ? (
            <>
              <Check className="h-3.5 w-3.5 text-success" /> kaydedildi
            </>
          ) : (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> yazılıyor…
            </>
          )}
        </span>
        <span className="hidden rounded-full border border-line px-2.5 py-1 text-[11px] text-ink-dim md:inline">
          {THEME_LABELS[theme]}
        </span>
        <button
          type="button"
          onClick={onToggleSide}
          className={`${iconButton} h-9 w-9 lg:hidden`}
          aria-label="Yan paneli aç"
        >
          <PanelRight className="h-4.5 w-4.5" />
        </button>
      </div>
    </header>
  );
}
