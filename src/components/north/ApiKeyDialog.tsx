import { useEffect, useState } from "react";
import { Key, X, Check, Trash2, ExternalLink } from "lucide-react";
import type { ApiKeyConfig } from "@/lib/north/storage";

interface ApiKeyDialogProps {
  open: boolean;
  config: ApiKeyConfig | null;
  onSave: (config: ApiKeyConfig) => void;
  onClear: () => void;
  onClose: () => void;
}

const PRESETS = [
  { provider: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", model: "google/gemini-2.5-flash" },
  { provider: "OpenAI", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  { provider: "Groq", baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" },
  { provider: "DeepSeek", baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" },
  { provider: "OpenAI uyumlu", baseUrl: "https://", model: "gpt-4o-mini" },
];

export function ApiKeyDialog({ open, config, onSave, onClear, onClose }: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://openrouter.ai/api/v1");
  const [model, setModel] = useState("google/gemini-2.5-flash");
  const [provider, setProvider] = useState("OpenRouter");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setApiKey(config?.apiKey ?? "");
      setBaseUrl(config?.baseUrl ?? "https://openrouter.ai/api/v1");
      setModel(config?.model ?? "google/gemini-2.5-flash");
      setProvider(config?.provider ?? "OpenRouter");
      setSaved(false);
    }
  }, [open, config]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handlePreset = (preset: (typeof PRESETS)[number]) => {
    setProvider(preset.provider);
    setBaseUrl(preset.baseUrl);
    setModel(preset.model);
  };

  const handleSave = () => {
    if (!apiKey.trim()) return;
    onSave({ provider, apiKey: apiKey.trim(), baseUrl: baseUrl.trim(), model: model.trim() });
    setSaved(true);
    setTimeout(() => onClose(), 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm">
      <div className="north-paper w-full max-w-md p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-serif text-lg font-bold">
            <Key className="h-5 w-5 text-primary" /> AI Anahtarı
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-ink-dim hover:bg-secondary"
            aria-label="Kapat"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <p className="mb-4 text-[13px] leading-relaxed text-ink-dim">
          Akış Modu için bir AI sağlayıcı API anahtarı gerekir. Anahtar yalnızca bu cihazda saklanır ve
          sunucu üzerinden güvenli şekilde iletilir.
        </p>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.provider}
              type="button"
              onClick={() => handlePreset(preset)}
              className={`rounded-full px-2.5 py-1 text-[11.5px] font-medium transition-colors ${
                provider === preset.provider
                  ? "bg-primary text-primary-foreground"
                  : "border border-line text-ink-dim hover:bg-secondary"
              }`}
            >
              {preset.provider}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink-dim">API Anahtarı</span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="rounded-lg border border-line bg-background px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink-dim">Sunucu adresi (Base URL)</span>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://..."
              className="rounded-lg border border-line bg-background px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink-dim">Model</span>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="model adı"
              className="rounded-lg border border-line bg-background px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
            />
          </label>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[12px] text-primary underline hover:opacity-80"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Anahtar al
          </a>
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          {config && (
            <button
              type="button"
              onClick={() => {
                onClear();
                setApiKey("");
                setSaved(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm text-ink-dim transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" /> Temizle
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" /> Kaydedildi
              </>
            ) : (
              "Kaydet"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
