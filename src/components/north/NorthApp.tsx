import { useCallback, useEffect, useState } from "react";
import { EditorView } from "./EditorView";
import { DocumentLibrary } from "./DocumentLibrary";
import { ExitDialog } from "./ExitDialog";
import {
  createInitialDoc,
  createBlankDoc,
  loadAllDocs,
  saveDoc,
  deleteDoc as removeDoc,
  getActiveDocId,
  setActiveDocId,
  listDocs,
  type NorthDoc,
} from "@/lib/north/storage";
import { importFromFile } from "@/lib/north/fileio";

type View = "library" | "editor";

export function NorthApp() {
  const [view, setView] = useState<View>("library");
  const [docs, setDocs] = useState<NorthDoc[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [exitDialog, setExitDialog] = useState(false);

  const refreshDocs = useCallback(() => {
    setDocs(listDocs());
  }, []);

  useEffect(() => {
    const all = loadAllDocs();
    const ids = Object.keys(all);
    if (ids.length === 0) {
      const initial = createInitialDoc();
      saveDoc(initial);
      setActiveDocId(initial.id);
      setDocs([initial]);
      setActiveId(initial.id);
      setView("editor");
    } else {
      const lastId = getActiveDocId();
      const target = lastId && all[lastId] ? lastId : ids[0]!;
      setActiveDocId(target);
      setActiveId(target);
      refreshDocs();
      setView("editor");
    }
  }, [refreshDocs]);

  const activeDoc = docs.find((d) => d.id === activeId) ?? null;

  const handleChange = useCallback(
    (doc: NorthDoc) => {
      setDocs((prev) => {
        const exists = prev.some((d) => d.id === doc.id);
        if (exists) return prev.map((d) => (d.id === doc.id ? doc : d));
        return [doc, ...prev];
      });
      saveDoc(doc);
      if (doc.id !== activeId) {
        setActiveDocId(doc.id);
        setActiveId(doc.id);
      }
    },
    [activeId],
  );

  const handleOpenDoc = useCallback((id: string) => {
    setActiveDocId(id);
    setActiveId(id);
    setView("editor");
  }, []);

  const handleCreateNew = useCallback(() => {
    const doc = createBlankDoc();
    saveDoc(doc);
    setActiveDocId(doc.id);
    setActiveId(doc.id);
    setDocs((prev) => [doc, ...prev]);
    setView("editor");
  }, []);

  const handleDeleteDoc = useCallback(
    (id: string) => {
      if (!window.confirm("Bu belgeyi silmek istediğine emin misin?")) return;
      removeDoc(id);
      const remaining = listDocs();
      setDocs(remaining);
      if (id === activeId) {
        if (remaining.length > 0) {
          setActiveDocId(remaining[0]!.id);
          setActiveId(remaining[0]!.id);
        } else {
          const fresh = createInitialDoc();
          saveDoc(fresh);
          setActiveDocId(fresh.id);
          setActiveId(fresh.id);
          setDocs([fresh]);
        }
      }
    },
    [activeId],
  );

  const handleImport = useCallback(
    async (files: FileList) => {
      try {
        const importedDocs: NorthDoc[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i]!;
          const doc = await importFromFile(file);
          saveDoc(doc);
          importedDocs.push(doc);
        }
        if (importedDocs.length > 0) {
          refreshDocs();
          const first = importedDocs[0]!;
          setActiveDocId(first.id);
          setActiveId(first.id);
          setView("editor");
        }
      } catch {
        /* ignore */
      }
    },
    [refreshDocs],
  );

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (activeDoc && view === "editor") {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [activeDoc, view]);

  useEffect(() => {
    const desktop = window.northDesktop;
    if (!desktop) return;
    desktop.onCloseRequested(() => {
      if (activeDoc && view === "editor") {
        setExitDialog(true);
      } else {
        desktop.closeWindow();
      }
    });
  }, [activeDoc, view]);

  const handleExitConfirm = useCallback(() => {
    setExitDialog(false);
    setView("library");
    window.northDesktop?.closeWindow();
  }, []);

  const handleExitCancel = useCallback(() => {
    setExitDialog(false);
    setView("library");
    window.northDesktop?.closeWindow();
  }, []);

  if (view === "library" || !activeDoc) {
    return (
      <>
        <DocumentLibrary
          docs={docs}
          activeId={activeId}
          onOpen={handleOpenDoc}
          onCreate={handleCreateNew}
          onDelete={handleDeleteDoc}
          onImport={handleImport}
          onClose={() => setView("editor")}
        />
      </>
    );
  }

  return (
    <>
      <EditorView
        doc={activeDoc}
        onChange={handleChange}
        onOpenLibrary={() => {
          if (activeDoc) {
            setExitDialog(true);
          } else {
            setView("library");
          }
        }}
        onCreateNew={handleCreateNew}
      />
      <ExitDialog
        open={exitDialog}
        doc={activeDoc}
        onConfirm={handleExitConfirm}
        onCancel={handleExitCancel}
      />
    </>
  );
}
