import { GitBranch, Plus, X, FileText, MoveVertical as MoreVertical, Pencil, Trash2, GitMerge } from "lucide-react";
import { useEffect, useRef } from "react";

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
  branchMenu: string | null;
  onClose: () => void;
  onJump: (id: string) => void;
  onSwitchBranch: (name: string) => void;
  onNewBranch: () => void;
  onRenameBranch: (name: string) => void;
  onDeleteBranch: (name: string) => void;
  onMergeBranch: (name: string) => void;
  onToggleBranchMenu: (name: string) => void;
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
  branchMenu,
  onClose,
  onJump,
  onSwitchBranch,
  onNewBranch,
  onRenameBranch,
  onDeleteBranch,
  onMergeBranch,
  onToggleBranchMenu,
}: OutlinePanelProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!branchMenu) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) onToggleBranchMenu("");
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [branchMenu, onToggleBranchMenu]);

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
                <div key={name} className="group relative">
                  <button
                    type="button"
                    onClick={() => onSwitchBranch(name)}
                    className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-[12.5px] transition-colors ${
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
                  {name !== "main" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBranchMenu(name);
                      }}
                      className={`absolute right-1 top-1/2 -translate-y-1/2 rounded p-0.5 transition-opacity ${
                        active
                          ? "opacity-70 hover:opacity-100"
                          : "opacity-0 group-hover:opacity-70 hover:opacity-100"
                      }`}
                      aria-label="Dal seçenekleri"
                    >
                      <MoreVertical className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {branchMenu === name && (
                    <div
                      ref={menuRef}
                      className="north-paper absolute left-2 top-9 z-40 flex w-40 flex-col gap-0.5 p-1.5"
                    >
                      <button
                        type="button"
                        onClick={() => onRenameBranch(name)}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] text-ink hover:bg-secondary"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Yeniden adlandır
                      </button>
                      <button
                        type="button"
                        onClick={() => onMergeBranch(name)}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] text-ink hover:bg-secondary"
                      >
                        <GitMerge className="h-3.5 w-3.5" /> Main'e birleştir
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteBranch(name)}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Dalı sil
                      </button>
                    </div>
                  )}
                </div>
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
