import { useEffect } from "react";
import { X } from "lucide-react";

const SHORTCUTS = [
  { keys: "⌘/Ctrl + B", action: "Kalın" },
  { keys: "⌘/Ctrl + I", action: "İtalik" },
  { keys: "⌘/Ctrl + U", action: "Altı çizili" },
  { keys: "⌘/Ctrl + S", action: "Kaydet" },
  { keys: "⌘/Ctrl + Z", action: "Geri al" },
  { keys: "⌘/Ctrl + Shift + Z", action: "İleri al" },
  { keys: "⌘/Ctrl + F", action: "Bul" },
  { keys: "⌘/Ctrl + H", action: "Bul ve değiştir" },
  { keys: "⌘/Ctrl + Enter", action: "Sayfa sonu ekle" },
  { keys: "⌘/Ctrl + +", action: "Yakınlaştır" },
  { keys: "⌘/Ctrl + -", action: "Uzaklaştır" },
  { keys: "⌘/Ctrl + 0", action: "Yakınlaştırmayı sıfırla" },
  { keys: "⌘/Ctrl + Shift + 8", action: "Madde listesi" },
  { keys: "⌘/Ctrl + Shift + 7", action: "Numaralı liste" },
  { keys: "Tab", action: "Akış önerisini kabul et" },
  { keys: "Esc", action: "Akış önerisini reddet" },
  { keys: "⌘/Ctrl + 1/2/3", action: "H1 / H2 / H3 başlık" },
  { keys: "⌘/Ctrl + 0", action: "Paragraf biçimi" },
];

interface ShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutsDialog({ open, onClose }: ShortcutsDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <div className="w-[30rem] max-w-[92vw] rounded-xl border border-line bg-panel p-5 shadow-panel">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-ink">Klavye Kısayolları</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-ink-dim hover:bg-secondary"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="north-scroll max-h-80 overflow-y-auto">
          <table className="w-full text-[13px]">
            <tbody>
              {SHORTCUTS.map((s, i) => (
                <tr
                  key={i}
                  className="border-b border-line/50 last:border-0"
                >
                  <td className="py-2 pr-4">
                    <kbd className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-ink">
                      {s.keys}
                    </kbd>
                  </td>
                  <td className="py-2 text-ink-dim">{s.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
