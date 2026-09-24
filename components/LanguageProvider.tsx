"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Lang, translate } from "@/lib/i18n";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "tia-lang";

/**
 * English / Nepali switch. The choice is remembered on the visitor's device
 * (a harmless preference — no personal data). Pages render in English first
 * and switch as soon as the saved choice is read.
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "ne" || saved === "en") setLangState(saved);
    } catch {
      // Storage blocked (private mode etc.) — stay on English.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore — the choice just won't be remembered.
    }
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, t: (key, vars) => translate(lang, key, vars) }),
    [lang, setLang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside <LanguageProvider>");
  return ctx;
}
