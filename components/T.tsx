"use client";

import { useLang } from "./LanguageProvider";

/** Translated text. Usable inside server components: <T k="cat.all" /> */
export default function T({ k, vars }: { k: string; vars?: Record<string, string | number> }) {
  const { t } = useLang();
  return <>{t(k, vars)}</>;
}
