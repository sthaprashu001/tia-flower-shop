"use client";

import { leadTimeText } from "@/lib/i18n";
import { useLang } from "./LanguageProvider";

/** Translated "Order 12 hours ahead"-style text for a product's lead time. */
export default function LeadTimeNote({ hours, k }: { hours: number; k: string }) {
  const { lang, t } = useLang();
  if (!hours || hours <= 0) return null;
  return <>{t(k, { time: leadTimeText(lang, hours) })}</>;
}
