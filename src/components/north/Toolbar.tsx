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
  Library,
  Plus,
  Key,
  FileText,
  Search,
  CirclePlus as PlusCircle,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Superscript as SupIcon,
  Subscript as SubIcon,
  MessageSquare,
  GitBranch,
  Keyboard,
  Printer,
  IndentIncrease,
  IndentDecrease,
} from "lucide-react";
import { THEME_LABELS, type ThemeName } from "@/lib/north/theme";
import { MenuBar } from "./MenuBar";
import type { EditorActions } from "./actions";

interface ToolbarProps {
  theme: ThemeName;
  flowEnabled: boolean;
  mdMode: boolean;
  saved: boolean;
  hasApiKey: boolean;
  docTitle: string;
  editingTitle: boolean;
  titleDraft: string;
  trackChanges: boolean;
  zoom: number;
  onTitleClick: () => void;
  onTitleChange: (value: string) => void;
  onTitleSave: () => void;
  onTitleCancel: () => void;
  onCommand: (command: string, value?: string) => void;
  onBlock: (tag: string) => void;
  onToggleFlow: () => void;
  onToggleMd: () => void;
  onLink: () => void;
  onToggleOutline: () => void;
  onToggleSide: () => void;
  onOpenLibrary: () => void;
  onCreateNew: () => void;
  onOpenApiKey: () => void;
  onOpenFind: () => void;
  onOpenInsert: () => void;
  onOpenPageSettings: () => void;
  onOpenShortcuts: () => void;
  onToggleComments: () => void;
  onToggleTrackChanges: () => void;
  onInsertPageBreak: () => void;
  onSetZoom: (zoom: number) => void;
  actions: EditorActions;
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
  hasApiKey,
  docTitle,
  editingTitle,
  titleDraft,
  trackChanges,
  zoom,
  onTitleClick,
  onTitleChange,
  onTitleSave,
  onTitleCancel,
  onCommand,
  onBlock,
  onToggleFlow,
  onToggleMd,
  onLink,
  onToggleOutline,
  onToggleSide,
  onOpenLibrary,
  onCreateNew,
  onOpenApiKey,
  onOpenFind,
  onOpenInsert,
  onOpenPageSettings,
  onOpenShortcuts,
  onToggleComments,
  onToggleTrackChanges,
  onInsertPageBreak,
  onSetZoom,
  actions,
}: ToolbarProps) {
  const [marks, setMarks] = useState<Record<string, boolean>>({});
  const [block, setBlock] = useState("P");

  useEffect(() => {
    const sync = () => {
      try {
        const next: Record<string, boolean> = {};
        for (const command of INLINE_COMMANDS) next[command] = document.queryCommandState(command);
        next["insertUnorderedList"] = document.queryCommandState("insertUnorderedList");
        next["insertOrderedList"] = document.queryCommandState("insertOrderedList");
        next["superscript"] = document.queryCommandState("superscript");
        next["subscript"] = document.queryCommandState("subscript");
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
    <header className="north-no-print col-span-full grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-line bg-panel/95 px-2 backdrop-blur-sm sm:px-4">
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={onToggleOutline}
          className={`${iconButton} h-9 w-9 lg:hidden`}
          aria-label="Taslak panelini aç"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>
        <button
          type="button"
          onClick={onOpenLibrary}
          className={`${iconButton} h-9 w-9`}
          aria-label="Belge kitaplığı"
          title="Belge kitaplığı"
        >
          <Library className="h-4.5 w-4.5" />
        </button>
        <button
          type="button"
          onClick={onCreateNew}
          className={`${iconButton} h-9 w-9`}
          aria-label="Yeni belge"
          title="Yeni belge"
        >
          <Plus className="h-4.5 w-4.5" />
        </button>
        <div className="hidden items-center gap-2 pr-1 sm:flex">
          <span className="h-2 w-2 shrink-0 rounded-full bg-primary ring-4 ring-primary/20" />
          <span className="font-serif text-[17px] font-bold tracking-wide">North</span>
        </div>
        <div className="hidden lg:flex">
          <MenuBar
            actions={actions}
            flowEnabled={flowEnabled}
            mdMode={mdMode}
            trackChanges={trackChanges}
          />
        </div>
      </div>

      <div className="north-scroll flex min-w-0 items-center gap-1.5 overflow-x-auto py-2">
        <div className="north-group hidden shrink-0 lg:flex">
          {editingTitle ? (
            <input
              autoFocus
              value={titleDraft}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={onTitleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") onTitleSave();
                if (e.key === "Escape") onTitleCancel();
              }}
              className="w-44 rounded-md border border-primary bg-background px-2 py-1 text-[13px] text-ink outline-none"
              placeholder="Belge başlığı"
            />
          ) : (
            <button
              type="button"
              onClick={onTitleClick}
              className="flex max-w-48 items-center gap-1.5 truncate rounded-md px-2 py-1 text-[13px] font-medium text-ink hover:bg-background/70"
              title="Başlığı düzenle"
            >
              <FileText className="h-3.5 w-3.5 shrink-0 text-ink-dim" />
              <span className="truncate">{docTitle || "Adsız belge"}</span>
            </button>
          )}
        </div>

        <div className="north-group">
          <button
            type="button"
            className={iconButton}
            onClick={() => onCommand("undo")}
            title="Geri al (⌘Z)"
            aria-label="Geri al"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={iconButton}
            onClick={() => onCommand("redo")}
            title="İleri al (⌘⇧Z)"
            aria-label="İleri al"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        <div className="north-group">
          <button
            type="button"
            className={markClass("bold")}
            aria-pressed={!!marks["bold"]}
            onClick={() => onCommand("bold")}
            title="Kalın (⌘B)"
            aria-label="Kalın"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={markClass("italic")}
            aria-pressed={!!marks["italic"]}
            onClick={() => onCommand("italic")}
            title="İtalik (⌘I)"
            aria-label="İtalik"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={markClass("underline")}
            aria-pressed={!!marks["underline"]}
            onClick={() => onCommand("underline")}
            title="Altı çizili (⌘U)"
            aria-label="Altı çizili"
          >
            <Underline className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={markClass("strikeThrough")}
            aria-pressed={!!marks["strikeThrough"]}
            onClick={() => onCommand("strikeThrough")}
            title="Üstü çizili"
            aria-label="Üstü çizili"
          >
            <Strikethrough className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={markClass("superscript")}
            aria-pressed={!!marks["superscript"]}
            onClick={() => onCommand("superscript")}
            title="Üst simge"
            aria-label="Üst simge"
          >
            <SupIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={markClass("subscript")}
            aria-pressed={!!marks["subscript"]}
            onClick={() => onCommand("subscript")}
            title="Alt simge"
            aria-label="Alt simge"
          >
            <SubIcon className="h-4 w-4" />
          </button>
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
          <label
            className={`${iconButton} cursor-pointer`}
            aria-label="Vurgu rengi"
            title="Vurgu rengi"
          >
            <Highlighter className="h-4 w-4" />
            <input
              type="color"
              className="sr-only"
              onChange={(event) => onCommand("hiliteColor", event.target.value)}
            />
          </label>
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
            title="Madde listesi (⌘⇧8)"
            aria-label="Madde listesi"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={markClass("insertOrderedList")}
            onClick={() => onCommand("insertOrderedList")}
            title="Numaralı liste (⌘⇧7)"
            aria-label="Numaralı liste"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
        </div>

        <div className="north-group">
          <button
            type="button"
            className={iconButton}
            onClick={() => onCommand("justifyLeft")}
            title="Sola yasla"
            aria-label="Sola yasla"
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={iconButton}
            onClick={() => onCommand("justifyCenter")}
            title="Ortala"
            aria-label="Ortala"
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={iconButton}
            onClick={() => onCommand("justifyRight")}
            title="Sağa yasla"
            aria-label="Sağa yasla"
          >
            <AlignRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={iconButton}
            onClick={() => onCommand("justifyFull")}
            title="İki yana yasla"
            aria-label="İki yana yasla"
          >
            <AlignJustify className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={iconButton}
            onClick={() => onCommand("indent")}
            title="Girintiyi artır"
            aria-label="Girintiyi artır"
          >
            <IndentIncrease className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={iconButton}
            onClick={() => onCommand("outdent")}
            title="Girintiyi azalt"
            aria-label="Girintiyi azalt"
          >
            <IndentDecrease className="h-4 w-4" />
          </button>
        </div>

        <div className="north-group">
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
            className={iconButton}
            onClick={onOpenFind}
            title="Bul ve değiştir (⌘F)"
            aria-label="Bul ve değiştir"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={iconButton}
            onClick={onOpenInsert}
            title="Ekle — tablo, görsel, simge"
            aria-label="Ekle"
          >
            <PlusCircle className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={iconButton}
            onClick={onInsertPageBreak}
            title="Sayfa sonu ekle"
            aria-label="Sayfa sonu ekle"
          >
            <FileText className="h-4 w-4" />
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

        <div className="north-group">
          <button
            type="button"
            onClick={onToggleComments}
            title="Yorumlar"
            aria-label="Yorumlar"
            className={iconButton}
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onToggleTrackChanges}
            aria-pressed={trackChanges}
            title="Değişiklikleri izle"
            aria-label="Değişiklikleri izle"
            className={`${iconButton} ${trackChanges ? activeButton : ""}`}
          >
            <GitBranch className="h-4 w-4" />
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
              : hasApiKey
                ? "border border-line text-ink hover:bg-secondary"
                : "border border-dashed border-line text-ink-dim hover:bg-secondary"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Akış</span>
          {!hasApiKey && <Key className="h-3 w-3 opacity-60" />}
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
        <button
          type="button"
          onClick={onOpenPageSettings}
          className={`${iconButton} hidden sm:inline-flex`}
          title="Sayfa yapısı ve yazdır"
          aria-label="Sayfa yapısı ve yazdır"
        >
          <Printer className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onOpenShortcuts}
          className={`${iconButton} hidden sm:inline-flex`}
          title="Klavye kısayolları"
          aria-label="Klavye kısayolları"
        >
          <Keyboard className="h-4 w-4" />
        </button>
        <span className="hidden rounded-full border border-line px-2.5 py-1 text-[11px] text-ink-dim md:inline">
          {THEME_LABELS[theme]}
        </span>
        <span className="hidden rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-ink-dim lg:inline">
          {Math.round(zoom * 100)}%
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
