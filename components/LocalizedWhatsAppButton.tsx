"use client";

import WhatsAppButton from "./WhatsAppButton";
import { useLang } from "./LanguageProvider";

/** WhatsApp button whose label follows the English / Nepali switch (usable from server pages). */
export default function LocalizedWhatsAppButton({ labelKey, message }: { labelKey: string; message?: string }) {
  const { t } = useLang();
  return <WhatsAppButton label={t(labelKey)} message={message} />;
}
