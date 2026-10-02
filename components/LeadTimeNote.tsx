"use client";

import { leadTimeText } from "@/lib/i18n";
import { useLang } from "./LanguageProvider";

/** Translated "Order 12 hours ahead"-style text for a product's lead time (in minutes). */
export default function LeadTimeNote({ minutes, k }: { minutes: number; k: string }) {
  const { lang, t } = useLang();
  if (!minutes || minutes <= 0) return null;
  return <>{t(k, { time: leadTimeText(lang, minutes) })}</>;
}
