import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { modKey, type EditorActions } from "./actions";

interface MenuBarProps {
  actions: EditorActions;
  flowEnabled: boolean;
  mdMode: boolean;
  trackChanges: boolean;
}

/**
 * Desktop-application menu bar (Dosya / Düzenle / Ekle / Biçim / Görünüm / AI).
 * Radix Menubar gives full keyboard navigation: arrow keys move between menus,
 * Home/End jump, typeahead selects, Escape closes.
 */
export function MenuBar({ actions: a, flowEnabled, mdMode, trackChanges }: MenuBarProps) {
  const mod = modKey();

  return (
    <Menubar className="h-8 gap-0 border-none bg-transparent p-0 shadow-none" aria-label="Ana menü">
      <MenubarMenu>
        <MenubarTrigger className="h-7 rounded-md px-2.5 text-[12.5px] font-medium">
          Dosya
        </MenubarTrigger>
        <MenubarContent align="start" className="min-w-56">
          <MenubarItem onSelect={a.newDoc}>
            Yeni belge <MenubarShortcut>{mod}N</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={a.openLibrary}>
            Kitaplığı aç <MenubarShortcut>{mod}⇧O</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={a.openFile}>Dosyadan içe aktar…</MenubarItem>
          <MenubarSeparator />
          <MenubarItem onSelect={a.save}>
            Kaydet <MenubarShortcut>{mod}S</MenubarShortcut>
          </MenubarItem>
          <MenubarSub>
            <MenubarSubTrigger>Farklı kaydet / dışa aktar</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem onSelect={() => a.exportAs("nh")}>North belgesi (.nh)</MenubarItem>
              <MenubarItem onSelect={() => a.exportAs("doc")}>Word belgesi (.doc)</MenubarItem>
              <MenubarItem onSelect={() => a.exportAs("md")}>Markdown (.md)</MenubarItem>
              <MenubarItem onSelect={() => a.exportAs("html")}>HTML (.html)</MenubarItem>
              <MenubarItem onSelect={() => a.exportAs("txt")}>Düz metin (.txt)</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarItem onSelect={a.print}>
            PDF olarak yazdır <MenubarShortcut>{mod}P</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onSelect={a.openVersions}>Sürüm geçmişi…</MenubarItem>
          <MenubarItem onSelect={a.openPageSettings}>Sayfa yapısı…</MenubarItem>
          <MenubarSeparator />
          <MenubarItem onSelect={a.resetDoc} className="text-destructive">
            Belgeyi sıfırla
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="h-7 rounded-md px-2.5 text-[12.5px] font-medium">
          Düzenle
        </MenubarTrigger>
        <MenubarContent align="start" className="min-w-56">
          <MenubarItem onSelect={a.undo}>
            Geri al <MenubarShortcut>{mod}Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={a.redo}>
            İleri al <MenubarShortcut>{mod}⇧Z</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onSelect={a.cut}>
            Kes <MenubarShortcut>{mod}X</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={a.copy}>
            Kopyala <MenubarShortcut>{mod}C</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={a.paste}>
            Yapıştır <MenubarShortcut>{mod}V</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={a.selectAll}>
            Tümünü seç <MenubarShortcut>{mod}A</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onSelect={a.find}>
            Bul ve değiştir <MenubarShortcut>{mod}F</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={a.openPalette}>
            Komut paleti <MenubarShortcut>{mod}K</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="h-7 rounded-md px-2.5 text-[12.5px] font-medium">
          Ekle
        </MenubarTrigger>
        <MenubarContent align="start" className="min-w-56">
          <MenubarItem onSelect={a.insertLink}>
            Bağlantı <MenubarShortcut>{mod}K</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={a.openInsert}>Tablo / görsel / simge…</MenubarItem>
          <MenubarItem onSelect={a.insertChecklist}>Yapılacaklar listesi</MenubarItem>
          <MenubarItem onSelect={a.insertRule}>Yatay çizgi</MenubarItem>
          <MenubarItem onSelect={a.insertPageBreak}>
            Sayfa sonu <MenubarShortcut>{mod}⏎</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onSelect={() => a.block("PRE")}>Kod bloğu</MenubarItem>
          <MenubarItem onSelect={() => a.block("BLOCKQUOTE")}>Alıntı</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="h-7 rounded-md px-2.5 text-[12.5px] font-medium">
          Biçim
        </MenubarTrigger>
        <MenubarContent align="start" className="min-w-56">
          <MenubarItem onSelect={() => a.command("bold")}>
            Kalın <MenubarShortcut>{mod}B</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={() => a.command("italic")}>
            İtalik <MenubarShortcut>{mod}I</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={() => a.command("underline")}>
            Altı çizili <MenubarShortcut>{mod}U</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={() => a.command("strikeThrough")}>Üstü çizili</MenubarItem>
          <MenubarSeparator />
          <MenubarSub>
            <MenubarSubTrigger>Paragraf stili</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem onSelect={() => a.block("H1")}>Başlık 1</MenubarItem>
              <MenubarItem onSelect={() => a.block("H2")}>Başlık 2</MenubarItem>
              <MenubarItem onSelect={() => a.block("H3")}>Başlık 3</MenubarItem>
              <MenubarItem onSelect={() => a.block("P")}>Gövde metni</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSub>
            <MenubarSubTrigger>Hizalama</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem onSelect={() => a.command("justifyLeft")}>Sola</MenubarItem>
              <MenubarItem onSelect={() => a.command("justifyCenter")}>Ortaya</MenubarItem>
              <MenubarItem onSelect={() => a.command("justifyRight")}>Sağa</MenubarItem>
              <MenubarItem onSelect={() => a.command("justifyFull")}>İki yana</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSub>
            <MenubarSubTrigger>Listeler</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem onSelect={() => a.command("insertUnorderedList")}>
                Madde listesi
              </MenubarItem>
              <MenubarItem onSelect={() => a.command("insertOrderedList")}>
                Numaralı liste
              </MenubarItem>
              <MenubarItem onSelect={a.insertChecklist}>Onay listesi</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarItem onSelect={() => a.command("removeFormat")}>Biçimi temizle</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="h-7 rounded-md px-2.5 text-[12.5px] font-medium">
          Görünüm
        </MenubarTrigger>
        <MenubarContent align="start" className="min-w-56">
          <MenubarItem onSelect={a.toggleOutline}>Taslak paneli</MenubarItem>
          <MenubarItem onSelect={a.toggleSide}>Araç paneli</MenubarItem>
          <MenubarItem onSelect={a.toggleComments}>Yorumlar</MenubarItem>
          <MenubarItem onSelect={a.toggleMarkdown}>
            Markdown görünümü {mdMode ? "· açık" : ""}
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onSelect={a.zoomIn}>
            Yakınlaştır <MenubarShortcut>{mod}+</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={a.zoomOut}>
            Uzaklaştır <MenubarShortcut>{mod}-</MenubarShortcut>
          </MenubarItem>
          <MenubarItem onSelect={a.zoomReset}>
            Yakınlaştırmayı sıfırla <MenubarShortcut>{mod}0</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="h-7 rounded-md px-2.5 text-[12.5px] font-medium">
          AI &amp; Dallar
        </MenubarTrigger>
        <MenubarContent align="start" className="min-w-56">
          <MenubarItem onSelect={a.toggleFlow}>
            Akış modu {flowEnabled ? "· açık" : "· kapalı"}
          </MenubarItem>
          <MenubarItem onSelect={a.openApiKey}>AI anahtarı…</MenubarItem>
          <MenubarItem onSelect={a.toggleDictation}>Sesli yazdırma</MenubarItem>
          <MenubarSeparator />
          <MenubarItem onSelect={a.newBranch}>Yeni dal</MenubarItem>
          <MenubarItem onSelect={a.toggleTrackChanges}>
            Değişiklikleri izle {trackChanges ? "· açık" : ""}
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem onSelect={a.openShortcuts}>Klavye kısayolları</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
