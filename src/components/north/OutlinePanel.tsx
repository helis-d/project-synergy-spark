import { GitBranch, Plus, X, FileText } from "lucide-react";

export interface OutlineItem {
  id: string;
  level: 1 | 2 | 3;
  text: string;
}

interface OutlinePanelProps {
  open: boolean;
  outline: OutlineItem[];
  branches: string[];
  activeBranch: string;
  words: number;
  readingMinutes: number;
  onClose: () => void;
  onJump: (id: string) => void;
  onSwitchBranch: (name: string) => void;
  onNewBranch: () => void;
}

const levelClass: Record<1 | 2 | 3, string> = {
  1: "font-semibold",
  2: "pl-4 opacity-85",
  3: "pl-8 text-xs opacity-70",
};

export function OutlinePanel({
  open,
  outline,
  branches,
  activeBranch,
  words,
  readingMinutes,
  onClose,
  onJump,
  onSwitchBranch,
  onNewBranch,
}: OutlinePanelProps) {
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Paneli kapat"
          onClick={onClose}
          className="fixed inset-0 z-20 bg-background/60 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside
        className={`north-scroll fixed top-14 bottom-0 left-0 z-30 w-[78vw] max-w-80 overflow-y-auto border-r border-line bg-panel px-2.5 py-4 transition-transform duration-250 lg:static lg:top-0 lg:z-0 lg:w-auto lg:max-w-none lg:translate-x-0 ${
          open ? "translate-x-0 shadow-panel" : "-translate-x-[110%]"
        }`}
      >
        <div className="mb-2.5 flex items-center justify-between px-2">
          <h2 className="text-[11px] tracking-widest text-ink-dim uppercase">Canlı Taslak</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-ink-dim hover:bg-secondary lg:hidden"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {outline.length === 0 ? (
          <p className="px-2.5 text-xs text-ink-dim">Başlık ekleyince burada belirir.</p>
        ) : (
          <nav className="flex flex-col">
            {outline.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onJump(item.id)}
                className={`truncate rounded-md px-2.5 py-1.5 text-left text-[13px] text-ink transition-colors hover:bg-secondary ${levelClass[item.level]}`}
              >
                {item.text || "(boş başlık)"}
              </button>
            ))}
          </nav>
        )}

        <div className="mt-6">
          <h2 className="mb-2.5 px-2 text-[11px] tracking-widest text-ink-dim uppercase">Dallar</h2>
          <div className="flex flex-col gap-0.5">
            {branches.map((name) => {
              const active = name === activeBranch;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onSwitchBranch(name)}
                  className={`flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-[12.5px] transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-ink hover:bg-secondary"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {name === "main" ? (
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <GitBranch className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span className="truncate">{name}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={onNewBranch}
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-line px-2 py-1.5 text-xs text-ink-dim transition-colors hover:bg-secondary hover:text-ink"
          >
            <Plus className="h-3.5 w-3.5" /> Yeni dal
          </button>
        </div>

        <div className="mt-6 border-t border-line px-2 pt-3 text-[11px] text-ink-dim">
          {words} kelime · ~{readingMinutes} dk okuma
        </div>
      </aside>
    </>
  );
}
