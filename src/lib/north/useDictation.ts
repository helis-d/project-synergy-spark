import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

interface ResultLike {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}

function capitalize(value: string): string {
  return value.charAt(0).toLocaleUpperCase("tr-TR") + value.slice(1);
}

/** Browser dictation with heuristic sentence punctuation. */
export function useDictation() {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const listeningRef = useRef(false);

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = document.documentElement.lang === "en" ? "en-US" : "tr-TR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const e = event as ResultLike;
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const result = e.results[i];
        if (result.isFinal) {
          const text = result[0].transcript.trim();
          if (text) setFinalText((prev) => `${prev}${capitalize(text)}. `);
        } else {
          interim += result[0].transcript;
        }
      }
      setInterimText(interim);
    };
    recognition.onend = () => {
      if (listeningRef.current) {
        try {
          recognition.start();
        } catch {
          listeningRef.current = false;
          setListening(false);
        }
      }
    };
    recognition.onerror = () => {
      listeningRef.current = false;
      setListening(false);
    };

    recognitionRef.current = recognition;
    setSupported(true);

    return () => {
      listeningRef.current = false;
      try {
        recognition.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    setFinalText("");
    setInterimText("");
    listeningRef.current = true;
    setListening(true);
    try {
      recognition.start();
    } catch {
      /* already started */
    }
  }, []);

  const stop = useCallback(() => {
    const recognition = recognitionRef.current;
    listeningRef.current = false;
    setListening(false);
    setInterimText("");
    try {
      recognition?.stop();
    } catch {
      /* ignore */
    }
    return finalText.trim();
  }, [finalText]);

  const clear = useCallback(() => {
    setFinalText("");
    setInterimText("");
  }, []);

  return { supported, listening, finalText, interimText, start, stop, clear };
}
