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
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink transition-colors hover:bg-secondary active:scale-95";
const textButton =
  "inline-flex h-9 shrink-0 items-center justify-center rounded-md px-2.5 text-[13px] font-medium text-ink transition-colors hover:bg-secondary active:scale-95";

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
  return (
    <header className="col-span-full grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-line bg-panel px-2 sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onToggleOutline}
          className={`${iconButton} lg:hidden`}
          aria-label="Taslak panelini aç"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>
        <div className="hidden items-center gap-2 pr-1 sm:flex">
          <span className="h-2 w-2 shrink-0 rounded-full bg-primary ring-4 ring-primary/20" />
          <span className="font-serif text-[17px] font-bold tracking-wide">North</span>
        </div>
      </div>

      <div className="north-scroll flex min-w-0 items-center gap-0.5 overflow-x-auto py-2">
        <button type="button" className={iconButton} onClick={() => onCommand("undo")} aria-label="Geri al">
          <Undo2 className="h-4 w-4" />
        </button>
        <button type="button" className={iconButton} onClick={() => onCommand("redo")} aria-label="İleri al">
          <Redo2 className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px shrink-0 bg-line" />
        <button type="button" className={iconButton} onClick={() => onCommand("bold")} aria-label="Kalın">
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" className={iconButton} onClick={() => onCommand("italic")} aria-label="İtalik">
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={iconButton}
          onClick={() => onCommand("underline")}
          aria-label="Altı çizili"
        >
          <Underline className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={iconButton}
          onClick={() => onCommand("strikeThrough")}
          aria-label="Üstü çizili"
        >
          <Strikethrough className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px shrink-0 bg-line" />
        {["H1", "H2", "H3"].map((tag) => (
          <button key={tag} type="button" className={textButton} onClick={() => onBlock(tag)}>
            {tag}
          </button>
        ))}
        <button type="button" className={textButton} onClick={() => onBlock("P")}>
          ¶
        </button>
        <button
          type="button"
          className={iconButton}
          onClick={() => onBlock("BLOCKQUOTE")}
          aria-label="Alıntı"
        >
          <Quote className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={iconButton}
          onClick={() => onCommand("insertUnorderedList")}
          aria-label="Madde listesi"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={iconButton}
          onClick={() => onCommand("insertOrderedList")}
          aria-label="Numaralı liste"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px shrink-0 bg-line" />
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
          className="h-9 shrink-0 rounded-md border border-line bg-background px-2 text-[13px] text-ink"
        >
          <option value="serif">Serif</option>
          <option value="sans">Sans</option>
          <option value="mono">Mono</option>
        </select>
        <label
          className={`${iconButton} cursor-pointer`}
          aria-label="Metin rengi"
          title="Metin rengi"
        >
          <span className="h-4 w-4 rounded-full border border-line bg-linear-to-br from-primary to-accent" />
          <input
            type="color"
            className="sr-only"
            onChange={(event) => onCommand("foreColor", event.target.value)}
          />
        </label>
        <span className="mx-1 h-5 w-px shrink-0 bg-line" />
        <button type="button" className={iconButton} onClick={onLink} aria-label="Bağlantı ekle">
          <Link2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToggleMd}
          aria-pressed={mdMode}
          className={`${iconButton} ${mdMode ? "bg-primary text-primary-foreground hover:bg-primary" : ""}`}
          aria-label="Markdown görünümü"
        >
          <Code2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToggleFlow}
          aria-pressed={flowEnabled}
          className={`${textButton} gap-1.5 ${flowEnabled ? "bg-primary text-primary-foreground hover:bg-primary" : ""}`}
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Akış</span>
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden text-[11px] text-ink-dim sm:inline">
          {saved ? "kaydedildi" : "yazılıyor…"}
        </span>
        <span className="hidden rounded-full border border-line px-2.5 py-1 text-[11px] text-ink-dim md:inline">
          {THEME_LABELS[theme]}
        </span>
        <button
          type="button"
          onClick={onToggleSide}
          className={`${iconButton} lg:hidden`}
          aria-label="Yan paneli aç"
        >
          <PanelRight className="h-4.5 w-4.5" />
        </button>
      </div>
    </header>
  );
}
