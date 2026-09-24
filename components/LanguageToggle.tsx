"use client";

import { useLang } from "./LanguageProvider";

export default function LanguageToggle() {
  const { lang, setLang } = useLang();
  const next = lang === "en" ? "ne" : "en";

  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      aria-label={lang === "en" ? "नेपालीमा हेर्नुहोस्" : "Switch to English"}
      className="rounded-full border border-sand px-2.5 py-1 text-xs font-semibold text-charcoal transition hover:border-rose hover:text-rose"
    >
      {lang === "en" ? "नेपाली" : "English"}
    </button>
  );
}
