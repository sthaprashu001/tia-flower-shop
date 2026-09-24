"use client";

import Link from "next/link";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useLang } from "@/components/LanguageProvider";

const QUESTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function FaqPage() {
  const { t } = useLang();

  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="font-display text-3xl italic text-charcoal">{t("faq.title")}</h1>
      <p className="mt-2 text-charcoal/70">{t("faq.intro")}</p>

      <div className="mt-8 space-y-3">
        {QUESTIONS.map((n) => (
          <details key={n} className="group rounded-card border border-sand bg-white p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium text-charcoal">
              {t(`faq.q${n}`)}
              <span className="text-rose-dark transition group-open:rotate-45" aria-hidden>
                +
              </span>
            </summary>
            <p className="mt-3 text-sm text-charcoal/70">{t(`faq.a${n}`)}</p>
          </details>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <WhatsAppButton />
        <Link href="/bouquets" className="text-sm font-semibold text-rose-dark hover:underline">
          {t("cart.browse")}
        </Link>
      </div>
    </div>
  );
}
