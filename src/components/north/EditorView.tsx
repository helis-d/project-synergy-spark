import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { GitBranch, Sparkles, Key } from "lucide-react";
import { Toolbar } from "./Toolbar";
import { OutlinePanel, type OutlineItem } from "./OutlinePanel";
import { SidePanel } from "./SidePanel";
import { LinkPopup } from "./LinkPopup";
import { ApiKeyDialog } from "./ApiKeyDialog";
import {
  countWords,
  estimateReadingMinutes,
  htmlToMarkdown,
  markdownToHtml,
} from "@/lib/north/markdown";
import {
  saveDoc,
  loadApiKeyConfigAsync,
  saveApiKeyConfigAsync,
  clearApiKeyConfigAsync,
  type NorthDoc,
  type ApiKeyConfig,
} from "@/lib/north/storage";
import { useTimeTheme } from "@/lib/north/useTimeTheme";
import { useDictation } from "@/lib/north/useDictation";
import { getFlowSuggestion } from "@/lib/north/flow.functions";
import { exportDoc, exportBranch, importFromFile, type ExportFormat } from "@/lib/north/fileio";
import { sanitizeHtml } from "@/lib/north/sanitize";

const GHOST_CLASS = "north-ghost";

function slugId(index: number) {
  return `north-heading-${index}`;
}

interface EditorViewProps {
  doc: NorthDoc;
  onChange: (doc: NorthDoc) => void;
  onOpenLibrary: () => void;
  onCreateNew: () => void;
}

export function EditorView({ doc, onChange, onOpenLibrary, onCreateNew }: EditorViewProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLSpanElement | null>(null);
  const flowTimer = useRef<number | null>(null);
  const savedRange = useRef<Range | null>(null);
  const fileImportRef = useRef<HTMLInputElement>(null);

  const [hydrated, setHydrated] = useState(false);
  const [saved, setSaved] = useState(true);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [words, setWords] = useState(0);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);
  const [mdMode, setMdMode] = useState(false);
  const [mdText, setMdText] = useState("");
  const [linkPos, setLinkPos] = useState<{ x: number; y: number } | null>(null);
  const [flowState, setFlowState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [flowMessage, setFlowMessage] = useState("");
  const [apiKeyConfig, setApiKeyConfig] = useState<ApiKeyConfig | null>(null);
  const [apiKeyOpen, setApiKeyOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(doc.title);
  const [branchMenu, setBranchMenu] = useState<string | null>(null);

  const dictation = useDictation();
  const requestFlow = useServerFn(getFlowSuggestion);

  const activeBranch = doc.activeBranch;
  const branches = useMemo(() => Object.keys(doc.branches), [doc.branches]);
  const currentHtml = doc.branches[activeBranch]?.html ?? "";

  useEffect(() => {
    void loadApiKeyConfigAsync().then(setApiKeyConfig);
  }, []);

  useEffect(() => {
    setTitleDraft(doc.title);
  }, [doc.title]);

  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = sanitizeHtml(currentHtml);
    refreshDerived();
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.id]);

  useEffect(() => {
    if (!hydrated || !editorRef.current) return;
    editorRef.current.innerHTML = sanitizeHtml(currentHtml);
    refreshDerived();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBranch]);

  const { hour, theme, setHour, setAutoTime } = useTimeTheme({
    autoTime: doc.autoTime,
    manualHour: doc.themeOverride,
    onChange: ({ autoTime, manualHour }) =>
      onChange({ ...doc, autoTime, themeOverride: manualHour }),
  });

  /* persistence */
  useEffect(() => {
    if (!hydrated) return;
    setSaved(false);
    const id = window.setTimeout(() => {
      saveDoc(doc);
      setSaved(true);
    }, 500);
    return () => window.clearTimeout(id);
  }, [doc, hydrated]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!saved) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saved]);

  const refreshDerived = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const headings = Array.from(editor.querySelectorAll<HTMLElement>("h1,h2,h3"));
    setOutline(
      headings.map((heading, index) => {
        const id = slugId(index);
        heading.id = id;
        return {
          id,
          level: Number(heading.tagName.slice(1)) as 1 | 2 | 3,
          text: heading.textContent ?? "",
        };
      }),
    );
    setWords(countWords(editor.innerText ?? ""));
  }, []);

  const commitHtml = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const clone = editor.cloneNode(true) as HTMLElement;
    clone.querySelectorAll(`.${GHOST_CLASS}`).forEach((node) => node.remove());
    const html = clone.innerHTML;
    onChange({
      ...doc,
      branches: {
        ...doc.branches,
        [doc.activeBranch]: { ...doc.branches[doc.activeBranch]!, html },
      },
    });
  }, [doc, onChange]);

  /* flow mode */
  const removeGhost = useCallback(() => {
    ghostRef.current?.remove();
    ghostRef.current = null;
    setFlowState((prev) => (prev === "ready" || prev === "loading" ? "idle" : prev));
  }, []);

  const scheduleFlow = useCallback(() => {
    if (flowTimer.current) window.clearTimeout(flowTimer.current);
    removeGhost();
    if (!doc.flowEnabled) return;
    flowTimer.current = window.setTimeout(async () => {
      const editor = editorRef.current;
      if (!editor) return;
      const keyConfig = apiKeyConfig ?? (await loadApiKeyConfigAsync());
      if (!keyConfig) {
        setFlowState("error");
        setFlowMessage("AI anahtarı gerekli — yan panelden ekle.");
        return;
      }
      const text = (editor.innerText ?? "").trim();
      if (text.length < 20) return;
      setFlowState("loading");
      try {
        const result = await requestFlow({
          data: {
            context: text.slice(-1500),
            language: "tr",
            apiKey: keyConfig.apiKey,
            baseUrl: keyConfig.baseUrl,
            model: keyConfig.model,
          },
        });
        if (!result.suggestion) {
          setFlowState("error");
          setFlowMessage(
            result.error === "rate_limited"
              ? "Akış limiti doldu, biraz sonra dene."
              : result.error === "credits"
                ? "AI kredisi tükendi."
                : result.error === "invalid_key"
                  ? "AI anahtarı geçersiz."
                  : result.error === "no_key"
                    ? "AI anahtarı gerekli."
                    : result.error === "blocked_host"
                      ? "Bu sunucu adresine izin verilmiyor. Yalnızca OpenRouter, OpenAI, Groq ve DeepSeek adresleri kullanılabilir."
                      : "Öneri alınamadı.",
          );
          return;
        }
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || !editor.contains(selection.anchorNode)) {
          setFlowState("idle");
          return;
        }
        const range = selection.getRangeAt(0);
        const ghost = document.createElement("span");
        ghost.className = GHOST_CLASS;
        ghost.textContent = ` ${result.suggestion}`;
        range.collapse(false);
        range.insertNode(ghost);
        ghostRef.current = ghost;
        setFlowState("ready");
      } catch {
        setFlowState("error");
        setFlowMessage("Öneri alınamadı.");
      }
    }, 1400);
  }, [doc.flowEnabled, removeGhost, requestFlow]);

  useEffect(
    () => () => {
      if (flowTimer.current) window.clearTimeout(flowTimer.current);
    },
    [],
  );

  /* editor handlers */
  const handleInput = useCallback(() => {
    refreshDerived();
    commitHtml();
    scheduleFlow();
  }, [commitHtml, refreshDerived, scheduleFlow]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (ghostRef.current) {
        if (event.key === "Tab") {
          event.preventDefault();
          ghostRef.current.classList.remove(GHOST_CLASS);
          ghostRef.current = null;
          setFlowState("idle");
          refreshDerived();
          commitHtml();
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          removeGhost();
          return;
        }
        removeGhost();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        commitHtml();
        saveDoc(doc);
        setSaved(true);
      }
    },
    [commitHtml, doc, refreshDerived, removeGhost],
  );

  const exec = useCallback(
    (command: string, value?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, value);
      handleInput();
    },

    [handleInput],
  );

  const execBlock = useCallback(
    (tag: string) => {
      editorRef.current?.focus();
      document.execCommand("formatBlock", false, tag);
      handleInput();
    },
    [handleInput],
  );

  const openLinkPopup = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.toString().trim().length === 0)
      return;
    const range = selection.getRangeAt(0);
    savedRange.current = range.cloneRange();
    const rect = range.getBoundingClientRect();
    setLinkPos({ x: rect.left, y: rect.bottom + 8 });
  }, []);

  const applyLink = useCallback(
    (href: string) => {
      const range = savedRange.current;
      if (range) {
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        document.execCommand("createLink", false, href);
      }
      setLinkPos(null);
      handleInput();
    },
    [handleInput],
  );

  const handleEditorClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (event.target as HTMLElement).closest("a");
    if (!anchor) return;
    event.preventDefault();
    const href = anchor.getAttribute("href") ?? "";
    if (href.startsWith("#")) {
      const target = Array.from(
        editorRef.current?.querySelectorAll<HTMLElement>("h1,h2,h3") ?? [],
      ).find((heading) => heading.textContent === decodeURIComponent(href.slice(1)));
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (href) {
      window.open(href, "_blank", "noopener,noreferrer");
    }
  }, []);

  /* branches */
  const switchBranch = useCallback(
    (name: string) => {
      commitHtml();
      onChange({ ...doc, activeBranch: name });
      setOutlineOpen(false);
      setBranchMenu(null);
    },
    [commitHtml, doc, onChange],
  );

  const newBranch = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const suggestion = `deneme-${Object.keys(doc.branches).length}`;
    const name = window.prompt("Yeni dal adı:", suggestion)?.trim();
    if (!name || doc.branches[name]) return;
    const html = editor.innerHTML;
    onChange({
      ...doc,
      branches: {
        ...doc.branches,
        [doc.activeBranch]: { ...doc.branches[doc.activeBranch]!, html },
        [name]: { html, parent: doc.activeBranch, createdAt: Date.now() },
      },
      activeBranch: name,
    });
  }, [doc, onChange]);

  const renameBranch = useCallback(
    (oldName: string) => {
      if (oldName === "main") return;
      const newName = window.prompt("Dal adını değiştir:", oldName)?.trim();
      if (!newName || newName === oldName || doc.branches[newName]) return;
      const newBranches = { ...doc.branches };
      const branchData = newBranches[oldName]!;
      delete newBranches[oldName];
      newBranches[newName] = branchData;
      const newActive = doc.activeBranch === oldName ? newName : doc.activeBranch;
      onChange({ ...doc, branches: newBranches, activeBranch: newActive });
      setBranchMenu(null);
    },
    [doc, onChange],
  );

  const deleteBranch = useCallback(
    (name: string) => {
      if (name === "main") return;
      if (!window.confirm(`"${name}" dalını silmek istediğine emin misin?`)) return;
      const newBranches = { ...doc.branches };
      delete newBranches[name];
      const newActive = doc.activeBranch === name ? "main" : doc.activeBranch;
      onChange({ ...doc, branches: newBranches, activeBranch: newActive });
      setBranchMenu(null);
    },
    [doc, onChange],
  );

  const mergeBranch = useCallback(
    (name: string) => {
      if (name === "main" || name === doc.activeBranch) return;
      if (!window.confirm(`"${name}" dalını "main" dalına birleştirmek istediğine emin misin?`))
        return;
      const branchHtml = doc.branches[name]?.html ?? "";
      onChange({
        ...doc,
        branches: {
          ...doc.branches,
          main: { ...doc.branches["main"]!, html: branchHtml },
        },
      });
      setBranchMenu(null);
    },
    [doc, onChange],
  );

  const diff = useMemo(() => {
    if (activeBranch === "main") return null;
    const strip = (html: string) => html.replace(/<[^>]+>/g, " ");
    const mainWords = strip(doc.branches["main"]?.html ?? "")
      .split(/\s+/)
      .filter(Boolean);
    const currentWords = strip(currentHtml).split(/\s+/).filter(Boolean);
    const mainSet = new Set(mainWords);
    const currentSet = new Set(currentWords);
    return {
      added: currentWords.filter((w) => !mainSet.has(w)).slice(0, 40),
      removed: mainWords.filter((w) => !currentSet.has(w)).slice(0, 40),
    };
  }, [activeBranch, currentHtml, doc.branches]);

  /* markdown mode */
  const toggleMd = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (!mdMode) {
      removeGhost();
      setMdText(htmlToMarkdown(editor));
      setMdMode(true);
    } else {
      editor.innerHTML = sanitizeHtml(markdownToHtml(mdText));
      setMdMode(false);
      refreshDerived();
      commitHtml();
    }
  }, [commitHtml, mdMode, mdText, refreshDerived, removeGhost]);

  /* dictation */
  const toggleDictation = useCallback(() => {
    if (!dictation.listening) {
      dictation.start();
      return;
    }
    const text = dictation.stop();
    if (!text) return;
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand("insertText", false, `${text} `);
    dictation.clear();
    handleInput();
  }, [dictation, handleInput]);

  /* document actions */
  const handleExport = useCallback(
    (format: ExportFormat) => {
      exportDoc(doc, format);
    },
    [doc],
  );

  const handleImport = useCallback(
    async (files: FileList) => {
      try {
        const file = files[0];
        if (!file) return;
        const imported = await importFromFile(file);
        onChange(imported);
        setSideOpen(false);
      } catch {
        /* ignore */
      }
    },
    [onChange],
  );

  const resetDoc = useCallback(() => {
    if (!window.confirm("Bu belgeyi sıfırlamak istediğine emin misin? Bu işlem geri alınamaz."))
      return;
    onChange({
      ...doc,
      activeBranch: "main",
      branches: { main: { html: "", parent: null, createdAt: Date.now() } },
    });
    if (editorRef.current) editorRef.current.innerHTML = "";
    refreshDerived();
  }, [doc, onChange, refreshDerived]);

  const handleTitleSave = useCallback(() => {
    setEditingTitle(false);
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== doc.title) {
      onChange({ ...doc, title: trimmed });
    } else {
      setTitleDraft(doc.title);
    }
  }, [doc, onChange, titleDraft]);

  const handleSaveApiKey = useCallback((config: ApiKeyConfig) => {
    void saveApiKeyConfigAsync(config);
    setApiKeyConfig(config);
  }, []);

  const handleClearApiKey = useCallback(() => {
    void clearApiKeyConfigAsync();
    setApiKeyConfig(null);
  }, []);

  const headings = useMemo(() => outline.map((item) => item.text).filter(Boolean), [outline]);

  return (
    <div className="grid h-[100dvh] grid-rows-[3.5rem_minmax(0,1fr)] lg:grid-cols-[15rem_minmax(0,1fr)_18rem]">
      <Toolbar
        theme={theme}
        flowEnabled={doc.flowEnabled}
        mdMode={mdMode}
        saved={saved}
        hasApiKey={!!apiKeyConfig}
        docTitle={doc.title}
        editingTitle={editingTitle}
        titleDraft={titleDraft}
        onTitleClick={() => setEditingTitle(true)}
        onTitleChange={setTitleDraft}
        onTitleSave={handleTitleSave}
        onTitleCancel={() => {
          setEditingTitle(false);
          setTitleDraft(doc.title);
        }}
        onCommand={exec}
        onBlock={execBlock}
        onToggleFlow={() => {
          if (!doc.flowEnabled && !apiKeyConfig) {
            setApiKeyOpen(true);
            return;
          }
          onChange({ ...doc, flowEnabled: !doc.flowEnabled });
        }}
        onToggleMd={toggleMd}
        onLink={openLinkPopup}
        onToggleOutline={() => setOutlineOpen((open) => !open)}
        onToggleSide={() => setSideOpen((open) => !open)}
        onOpenLibrary={onOpenLibrary}
        onCreateNew={onCreateNew}
        onOpenApiKey={() => setApiKeyOpen(true)}
      />

      <OutlinePanel
        open={outlineOpen}
        outline={outline}
        branches={branches}
        activeBranch={activeBranch}
        words={words}
        readingMinutes={estimateReadingMinutes(words)}
        branchMenu={branchMenu}
        onClose={() => setOutlineOpen(false)}
        onJump={(id) => {
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
          setOutlineOpen(false);
        }}
        onSwitchBranch={switchBranch}
        onNewBranch={newBranch}
        onRenameBranch={renameBranch}
        onDeleteBranch={deleteBranch}
        onMergeBranch={mergeBranch}
        onToggleBranchMenu={(name) => setBranchMenu((prev) => (prev === name ? null : name))}
      />

      <div className="flex min-h-0 flex-col">
        <main className="north-scroll flex-1 overflow-y-auto px-3 py-6 sm:px-6 sm:py-10">
          <div
            className={mdMode ? "mx-auto grid max-w-6xl gap-5 lg:grid-cols-2" : "mx-auto max-w-3xl"}
          >
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              spellCheck
              role="textbox"
              aria-multiline="true"
              aria-label="Belge içeriği"
              data-placeholder="Yazmaya başla…"
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onMouseUp={openLinkPopup}
              onClick={handleEditorClick}
              onBlur={commitHtml}
              className="north-paper north-prose min-h-[calc(100dvh-13rem)] px-5 py-7 text-ink outline-none sm:px-10 sm:py-12"
              style={mdMode ? { pointerEvents: "none", opacity: 0.85 } : undefined}
            />
            {mdMode && (
              <textarea
                value={mdText}
                onChange={(event) => setMdText(event.target.value)}
                aria-label="Markdown kaynağı"
                className="north-paper min-h-[calc(100dvh-13rem)] w-full resize-none p-5 font-mono text-[13.5px] leading-relaxed text-ink outline-none focus:border-primary"
              />
            )}
          </div>
        </main>

        <footer className="flex shrink-0 items-center gap-3 border-t border-line bg-panel/95 px-3 py-2 text-[11.5px] text-ink-dim backdrop-blur-sm sm:px-6">
          <span className="inline-flex items-center gap-1.5">
            <GitBranch className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-ink">{activeBranch}</span>
          </span>
          <span className="h-3 w-px bg-line" />
          <span>{words} kelime</span>
          <span className="hidden sm:inline">· ~{estimateReadingMinutes(words)} dk okuma</span>
          <span className="ml-auto inline-flex items-center gap-1.5">
            {doc.flowEnabled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/12 px-2 py-0.5 text-primary">
                <Sparkles className="h-3 w-3" /> akış açık
              </span>
            )}
            <span className={saved ? "text-success" : ""}>
              {saved ? "kaydedildi" : "kaydediliyor…"}
            </span>
          </span>
        </footer>
      </div>

      <SidePanel
        open={sideOpen}
        theme={theme}
        hour={hour}
        autoTime={doc.autoTime}
        dictationSupported={dictation.supported}
        listening={dictation.listening}
        finalText={dictation.finalText}
        interimText={dictation.interimText}
        diff={diff}
        activeBranch={activeBranch}
        hasApiKey={!!apiKeyConfig}
        onClose={() => setSideOpen(false)}
        onToggleDictation={toggleDictation}
        onClearDictation={dictation.clear}
        onHourChange={setHour}
        onAutoTimeChange={setAutoTime}
        onExport={handleExport}
        onExportBranch={(format, branchName) => exportBranch(doc, branchName, format)}
        onImport={handleImport}
        onReset={resetDoc}
        onOpenApiKey={() => setApiKeyOpen(true)}
        fileImportRef={fileImportRef}
      />

      <LinkPopup
        position={linkPos}
        headings={headings}
        onApply={applyLink}
        onClose={() => setLinkPos(null)}
      />

      <ApiKeyDialog
        open={apiKeyOpen}
        config={apiKeyConfig}
        onSave={handleSaveApiKey}
        onClear={handleClearApiKey}
        onClose={() => setApiKeyOpen(false)}
      />

      <input
        ref={fileImportRef}
        type="file"
        accept=".nh,.json,.md,.markdown,.html,.htm,.txt"
        className="sr-only"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) handleImport(e.target.files);
          e.target.value = "";
        }}
      />

      {(flowState === "ready" || flowState === "loading" || flowState === "error") && (
        <div className="pointer-events-none north-rise fixed bottom-14 left-1/2 z-40 flex max-w-[92vw] -translate-x-1/2 items-center gap-2.5 rounded-full border border-line bg-panel px-4 py-2 text-[12.5px] text-ink-dim shadow-panel">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
          {flowState === "loading" && <span>öneri hazırlanıyor…</span>}
          {flowState === "error" && (
            <span className="flex items-center gap-1.5">
              {flowMessage}
              {!apiKeyConfig && (
                <button
                  type="button"
                  onClick={() => setApiKeyOpen(true)}
                  className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground"
                >
                  <Key className="h-3 w-3" /> Anahtar ekle
                </button>
              )}
            </span>
          )}
          {flowState === "ready" && (
            <span className="truncate">
              öneri hazır ·{" "}
              <kbd className="rounded bg-secondary px-1.5 py-0.5 text-[11px]">Tab</kbd> kabul ·{" "}
              <kbd className="rounded bg-secondary px-1.5 py-0.5 text-[11px]">Esc</kbd> vazgeç
            </span>
          )}
        </div>
      )}
    </div>
  );
}
