import { useState, useEffect, useRef } from "react";
import {
  Table as TableIcon,
  Image as ImageIcon,
  Sigma,
  Subscript as SubIcon,
  Highlighter,
  X,
  Pilcrow,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  IndentIncrease,
  IndentDecrease,
  ZoomIn,
  ZoomOut,
  Printer,
  Type,
  Minus,
} from "lucide-react";

interface InsertMenuProps {
  open: boolean;
  onClose: () => void;
  onCommand: (command: string, value?: string) => void;
  onInsertTable: (rows: number, cols: number) => void;
  onInsertImage: (src: string) => void;
  onSetZoom: (zoom: number) => void;
  zoom: number;
}

const SPECIAL_CHARS = [
  { label: "°", name: "Derece" },
  { label: "©", name: "Telif" },
  { label: "®", name: "Tescilli" },
  { label: "™", name: "Marka" },
  { label: "€", name: "Euro" },
  { label: "₺", name: "Türk Lirası" },
  { label: "£", name: "Sterlin" },
  { label: "¥", name: "Yen" },
  { label: "•", name: "Madde" },
  { label: "—", name: "Uzun tire" },
  { label: "–", name: "Kısa tire" },
  { label: "\u201C", name: "Sol tırnak" },
  { label: "\u201D", name: "Sağ tırnak" },
  { label: "…", name: "Üç nokta" },
  { label: "§", name: "Paragraf" },
  { label: "¶", name: "Pilcrow" },
  { label: "≠", name: "Eşit değil" },
  { label: "≈", name: "Yaklaşık" },
  { label: "≤", name: "Küçük eşit" },
  { label: "≥", name: "Büyük eşit" },
  { label: "×", name: "Çarpı" },
  { label: "÷", name: "Bölü" },
  { label: "±", name: "Artı eksi" },
  { label: "√", name: "Karekök" },
  { label: "∞", name: "Sonsuz" },
  { label: "→", name: "Sağ ok" },
  { label: "←", name: "Sol ok" },
  { label: "↑", name: "Yukarı ok" },
  { label: "↓", name: "Aşağı ok" },
  { label: "♦", name: "Karo" },
];

const FONTS = [
  { label: "Serif", value: "'Source Serif 4', serif" },
  { label: "Sans", value: "'Inter', sans-serif" },
  { label: "Mono", value: "'JetBrains Mono', monospace" },
  { label: "Times", value: "'Times New Roman', serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Courier", value: "'Courier New', monospace" },
  { label: "Verdana", value: "Verdana, sans-serif" },
];

const FONT_SIZES = [
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "4", value: "4" },
  { label: "5", value: "5" },
  { label: "6", value: "6" },
  { label: "7", value: "7" },
];

const HIGHLIGHT_COLORS = [
  "oklch(0.92 0.16 95)",
  "oklch(0.88 0.14 145)",
  "oklch(0.90 0.12 220)",
  "oklch(0.90 0.14 300)",
  "oklch(0.90 0.12 30)",
  "transparent",
];

export function InsertMenu({
  open,
  onClose,
  onCommand,
  onInsertTable,
  onInsertImage,
  onSetZoom,
  zoom,
}: InsertMenuProps) {
  const [mode, setMode] = useState<"root" | "table" | "image" | "symbol" | "font" | "zoom">("root");
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [imageUrl, setImageUrl] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setMode("root");
      setImageUrl("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (mode !== "root") setMode("root");
        else onClose();
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, mode, onClose]);

  if (!open) return null;

  const rootItems = [
    { icon: TableIcon, label: "Tablo", action: () => setMode("table") },
    { icon: ImageIcon, label: "Görsel", action: () => setMode("image") },
    {
      icon: Sigma,
      label: "Üst simge",
      action: () => {
        onCommand("superscript");
        onClose();
      },
    },
    {
      icon: SubIcon,
      label: "Alt simge",
      action: () => {
        onCommand("subscript");
        onClose();
      },
    },
    { icon: Highlighter, label: "Vurgu", action: () => setMode("font") },
    { icon: Type, label: "Yazı tipi", action: () => setMode("font") },
    { icon: Pilcrow, label: "Özel karakter", action: () => setMode("symbol") },
    { icon: ZoomIn, label: "Yakınlaştır", action: () => setMode("zoom") },
  ];

  const alignmentItems = [
    { icon: AlignLeft, label: "Sola", cmd: "justifyLeft" },
    { icon: AlignCenter, label: "Ortaya", cmd: "justifyCenter" },
    { icon: AlignRight, label: "Sağa", cmd: "justifyRight" },
    { icon: AlignJustify, label: "İki yana", cmd: "justifyFull" },
  ];

  return (
    <div
      ref={containerRef}
      className="fixed right-4 top-16 z-50 w-72 rounded-lg border border-line bg-panel p-2 shadow-panel"
      role="dialog"
      aria-label="Ekle"
    >
      <div className="mb-1.5 flex items-center justify-between px-1">
        <h3 className="text-[13px] font-semibold text-ink">
          {mode === "root"
            ? "Ekle"
            : mode === "table"
              ? "Tablo Ekle"
              : mode === "image"
                ? "Görsel Ekle"
                : mode === "symbol"
                  ? "Özel Karakter"
                  : mode === "font"
                    ? "Biçimlendirme"
                    : "Yakınlaştır"}
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-0.5 text-ink-dim hover:bg-secondary"
          aria-label="Kapat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {mode === "root" && (
        <div className="grid grid-cols-2 gap-1">
          {rootItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.action}
              className="flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-[12.5px] text-ink hover:bg-secondary"
            >
              <item.icon className="h-4 w-4 shrink-0 text-ink-dim" />
              {item.label}
            </button>
          ))}
        </div>
      )}

      {mode === "table" && (
        <div className="space-y-3 p-1">
          <div className="flex items-center gap-2">
            <label className="text-[12px] text-ink-dim">Satır</label>
            <input
              type="number"
              min={1}
              max={20}
              value={tableRows}
              onChange={(e) => setTableRows(Math.max(1, Math.min(20, Number(e.target.value))))}
              className="w-16 rounded-md border border-line bg-background px-2 py-1 text-[13px] text-ink outline-none focus:border-primary"
            />
            <label className="text-[12px] text-ink-dim">Sütun</label>
            <input
              type="number"
              min={1}
              max={10}
              value={tableCols}
              onChange={(e) => setTableCols(Math.max(1, Math.min(10, Number(e.target.value))))}
              className="w-16 rounded-md border border-line bg-background px-2 py-1 text-[13px] text-ink outline-none focus:border-primary"
            />
          </div>
          <div
            className="grid gap-0.5"
            style={{ gridTemplateColumns: `repeat(${tableCols}, 1fr)` }}
          >
            {Array.from({ length: tableRows * tableCols }).map((_, i) => (
              <div key={i} className="h-6 rounded-sm border border-line bg-secondary/50" />
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              onInsertTable(tableRows, tableCols);
              onClose();
            }}
            className="w-full rounded-md bg-primary py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            Tabloyu ekle
          </button>
        </div>
      )}

      {mode === "image" && (
        <div className="space-y-2 p-1">
          <input
            autoFocus
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Görsel URL (https://...)"
            className="w-full rounded-md border border-line bg-background px-2.5 py-1.5 text-[13px] text-ink outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={() => {
              if (imageUrl.trim()) {
                onInsertImage(imageUrl.trim());
                onClose();
              }
            }}
            disabled={!imageUrl.trim()}
            className="w-full rounded-md bg-primary py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            Görseli ekle
          </button>
          <p className="text-[11px] text-ink-dim">
            Görsel bağlantısını yapıştırın. North görseli belge içine gömer.
          </p>
        </div>
      )}

      {mode === "symbol" && (
        <div className="north-scroll max-h-64 overflow-y-auto p-1">
          <div className="grid grid-cols-6 gap-1">
            {SPECIAL_CHARS.map((char) => (
              <button
                key={`${char.label}-${char.name}`}
                type="button"
                onClick={() => {
                  onCommand("insertText", char.label);
                  onClose();
                }}
                className="flex h-9 items-center justify-center rounded-md border border-line text-[16px] text-ink hover:bg-secondary"
                title={char.name}
              >
                {char.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === "font" && (
        <div className="space-y-3 p-1">
          <div>
            <p className="mb-1 text-[11px] text-ink-dim uppercase tracking-wide">
              Yazı tipi ailesi
            </p>
            <div className="flex flex-col gap-0.5">
              {FONTS.map((font) => (
                <button
                  key={font.value}
                  type="button"
                  onClick={() => {
                    onCommand("fontName", font.value);
                  }}
                  className="rounded-md px-2.5 py-1.5 text-left text-[12.5px] text-ink hover:bg-secondary"
                  style={{ fontFamily: font.value }}
                >
                  {font.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-[11px] text-ink-dim uppercase tracking-wide">Yazı boyutu</p>
            <div className="flex flex-wrap gap-1">
              {FONT_SIZES.map((size) => (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => {
                    onCommand("fontSize", size.value);
                  }}
                  className="h-7 w-7 rounded-md border border-line text-[12px] text-ink hover:bg-secondary"
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-[11px] text-ink-dim uppercase tracking-wide">Vurgu rengi</p>
            <div className="flex gap-1.5">
              {HIGHLIGHT_COLORS.map((color, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onCommand("hiliteColor", color);
                  }}
                  className="h-7 w-7 rounded-md border border-line"
                  style={{ backgroundColor: color === "transparent" ? undefined : color }}
                  title={color === "transparent" ? "Vurguyu kaldır" : ""}
                >
                  {color === "transparent" && <Minus className="mx-auto h-3 w-3 text-ink-dim" />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-[11px] text-ink-dim uppercase tracking-wide">Hizalama</p>
            <div className="flex gap-1">
              {alignmentItems.map((item) => (
                <button
                  key={item.cmd}
                  type="button"
                  onClick={() => {
                    onCommand(item.cmd);
                  }}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-line text-ink hover:bg-secondary"
                  title={item.label}
                >
                  <item.icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-[11px] text-ink-dim uppercase tracking-wide">Girinti</p>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => onCommand("outdent")}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-line text-ink hover:bg-secondary"
                title="Girintiyi azalt"
              >
                <IndentDecrease className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onCommand("indent")}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-line text-ink hover:bg-secondary"
                title="Girintiyi artır"
              >
                <IndentIncrease className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === "zoom" && (
        <div className="space-y-2 p-1">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => onSetZoom(Math.max(0.5, zoom - 0.1))}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-line text-ink hover:bg-secondary"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="font-mono text-[14px] text-ink">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => onSetZoom(Math.min(2.5, zoom + 0.1))}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-line text-ink hover:bg-secondary"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
          <input
            type="range"
            min={0.5}
            max={2.5}
            step={0.1}
            value={zoom}
            onChange={(e) => onSetZoom(Number(e.target.value))}
            className="north-range w-full"
            style={{ ["--fill" as string]: `${((zoom - 0.5) / 2) * 100}%` }}
          />
          <button
            type="button"
            onClick={() => onSetZoom(1)}
            className="w-full rounded-md border border-line py-1.5 text-[12px] text-ink hover:bg-secondary"
          >
            %100'e sıfırla
          </button>
        </div>
      )}
    </div>
  );
}
