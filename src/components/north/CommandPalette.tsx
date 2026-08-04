import { useEffect, useMemo } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Braces,
  FileDown,
  FilePlus2,
  FileText,
  GitBranch,
  Heading1,
  Heading2,
  Heading3,
  History,
  Italic,
  Key,
  Keyboard,
  Library,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  Mic,
  Minus,
  PanelLeft,
  PanelRight,
  Pilcrow,
  Printer,
  Quote,
  Redo2,
  Save,
  Search,
  Settings2,
  Sparkles,
  Strikethrough,
  Underline,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { modKey, type EditorActions } from "./actions";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions: EditorActions;
}

interface Entry {
  group: string;
  label: string;
  icon: typeof Bold;
  run: () => void;
  keywords?: string;
  shortcut?: string;
}

/** Ctrl/⌘+K palette: every editor action reachable by typing, in Turkish. */
export function CommandPalette({ open, onOpenChange, actions: a }: CommandPaletteProps) {
  const mod = modKey();

  const entries = useMemo<Entry[]>(
    () => [
      /* Belge */
      { group: "Belge", label: "Yeni belge", icon: FilePlus2, run: a.newDoc, shortcut: `${mod}N` },
      { group: "Belge", label: "Kitaplığı aç", icon: Library, run: a.openLibrary },
      { group: "Belge", label: "Kaydet", icon: Save, run: a.save, shortcut: `${mod}S` },
      {
        group: "Belge",
        label: "Word olarak dışa aktar (.doc)",
        icon: FileDown,
        run: () => a.exportAs("doc"),
        keywords: "word docx export dışa aktar",
      },
      {
        group: "Belge",
        label: "Markdown olarak dışa aktar (.md)",
        icon: FileDown,
        run: () => a.exportAs("md"),
      },
      {
        group: "Belge",
        label: "North belgesi olarak dışa aktar (.nh)",
        icon: FileDown,
        run: () => a.exportAs("nh"),
      },
      {
        group: "Belge",
        label: "Düz metin olarak dışa aktar (.txt)",
        icon: FileDown,
        run: () => a.exportAs("txt"),
      },
      {
        group: "Belge",
        label: "PDF olarak yazdır",
        icon: Printer,
        run: a.print,
        shortcut: `${mod}P`,
        keywords: "pdf print yazdır",
      },
      {
        group: "Belge",
        label: "Sürüm geçmişi",
        icon: History,
        run: a.openVersions,
        keywords: "version history geçmiş yedek",
      },
      { group: "Belge", label: "Sayfa yapısı", icon: Settings2, run: a.openPageSettings },

      /* Düzenle */
      { group: "Düzenle", label: "Geri al", icon: Undo2, run: a.undo, shortcut: `${mod}Z` },
      { group: "Düzenle", label: "İleri al", icon: Redo2, run: a.redo, shortcut: `${mod}⇧Z` },
      {
        group: "Düzenle",
        label: "Bul ve değiştir",
        icon: Search,
        run: a.find,
        shortcut: `${mod}F`,
      },

      /* Biçim */
      { group: "Biçim", label: "Kalın", icon: Bold, run: () => a.command("bold") },
      { group: "Biçim", label: "İtalik", icon: Italic, run: () => a.command("italic") },
      { group: "Biçim", label: "Altı çizili", icon: Underline, run: () => a.command("underline") },
      {
        group: "Biçim",
        label: "Üstü çizili",
        icon: Strikethrough,
        run: () => a.command("strikeThrough"),
      },
      { group: "Biçim", label: "Başlık 1", icon: Heading1, run: () => a.block("H1") },
      { group: "Biçim", label: "Başlık 2", icon: Heading2, run: () => a.block("H2") },
      { group: "Biçim", label: "Başlık 3", icon: Heading3, run: () => a.block("H3") },
      { group: "Biçim", label: "Gövde metni", icon: Pilcrow, run: () => a.block("P") },
      { group: "Biçim", label: "Alıntı", icon: Quote, run: () => a.block("BLOCKQUOTE") },
      { group: "Biçim", label: "Kod bloğu", icon: Braces, run: () => a.block("PRE") },
      {
        group: "Biçim",
        label: "Madde listesi",
        icon: List,
        run: () => a.command("insertUnorderedList"),
      },
      {
        group: "Biçim",
        label: "Numaralı liste",
        icon: ListOrdered,
        run: () => a.command("insertOrderedList"),
      },
      { group: "Biçim", label: "Onay listesi", icon: ListTodo, run: a.insertChecklist },
      {
        group: "Biçim",
        label: "Sola hizala",
        icon: AlignLeft,
        run: () => a.command("justifyLeft"),
      },
      {
        group: "Biçim",
        label: "Ortala",
        icon: AlignCenter,
        run: () => a.command("justifyCenter"),
      },
      {
        group: "Biçim",
        label: "Sağa hizala",
        icon: AlignRight,
        run: () => a.command("justifyRight"),
      },
      {
        group: "Biçim",
        label: "İki yana yay",
        icon: AlignJustify,
        run: () => a.command("justifyFull"),
      },

      /* Ekle */
      { group: "Ekle", label: "Bağlantı ekle", icon: Link2, run: a.insertLink },
      { group: "Ekle", label: "Tablo / görsel / simge", icon: FileText, run: a.openInsert },
      { group: "Ekle", label: "Yatay çizgi", icon: Minus, run: a.insertRule },
      { group: "Ekle", label: "Sayfa sonu", icon: FileText, run: a.insertPageBreak },

      /* Görünüm */
      {
        group: "Görünüm",
        label: "Taslak panelini aç/kapat",
        icon: PanelLeft,
        run: a.toggleOutline,
      },
      { group: "Görünüm", label: "Araç panelini aç/kapat", icon: PanelRight, run: a.toggleSide },
      { group: "Görünüm", label: "Yorumlar", icon: PanelRight, run: a.toggleComments },
      { group: "Görünüm", label: "Markdown görünümü", icon: FileText, run: a.toggleMarkdown },
      { group: "Görünüm", label: "Yakınlaştır", icon: ZoomIn, run: a.zoomIn },
      { group: "Görünüm", label: "Uzaklaştır", icon: ZoomOut, run: a.zoomOut },
      { group: "Görünüm", label: "Yakınlaştırmayı sıfırla", icon: ZoomOut, run: a.zoomReset },

      /* AI */
      {
        group: "AI & Dallar",
        label: "Akış modunu aç/kapat",
        icon: Sparkles,
        run: a.toggleFlow,
        keywords: "ai flow akış öneri",
      },
      { group: "AI & Dallar", label: "AI anahtarı", icon: Key, run: a.openApiKey },
      { group: "AI & Dallar", label: "Sesli yazdırma", icon: Mic, run: a.toggleDictation },
      { group: "AI & Dallar", label: "Yeni dal", icon: GitBranch, run: a.newBranch },
      {
        group: "AI & Dallar",
        label: "Değişiklikleri izle",
        icon: History,
        run: a.toggleTrackChanges,
      },
      { group: "AI & Dallar", label: "Klavye kısayolları", icon: Keyboard, run: a.openShortcuts },
    ],
    [a, mod],
  );

  const groups = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const entry of entries) {
      const list = map.get(entry.group) ?? [];
      list.push(entry);
      map.set(entry.group, list);
    }
    return [...map.entries()];
  }, [entries]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-[560px]">
        <DialogTitle className="sr-only">Komut paleti</DialogTitle>
        <Command loop>
          <CommandInput placeholder="Komut ara… (örn. başlık, dışa aktar, akış)" />
          <CommandList className="max-h-[60vh]">
            <CommandEmpty>Sonuç bulunamadı.</CommandEmpty>
            {groups.map(([group, items], index) => (
              <div key={group}>
                {index > 0 && <CommandSeparator />}
                <CommandGroup heading={group}>
                  {items.map((item) => (
                    <CommandItem
                      key={`${group}-${item.label}`}
                      value={`${item.label} ${item.keywords ?? ""}`}
                      onSelect={() => {
                        onOpenChange(false);
                        /* let the dialog release focus before the command runs
                         * against the editor selection */
                        setTimeout(item.run, 0);
                      }}
                    >
                      <item.icon className="mr-2 h-4 w-4 opacity-70" aria-hidden="true" />
                      <span>{item.label}</span>
                      {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </div>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
