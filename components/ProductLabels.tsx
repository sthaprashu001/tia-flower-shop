"use client";

import { Occasion, OCCASION_EMOJI, ProductKind } from "@/lib/types";
import { useLang } from "./LanguageProvider";

/**
 * Small badge that says whether a product is fresh or artificial, so customers
 * always know what they are buying. Renders nothing for khata/flags/unclassified.
 */
export function KindBadge({ kind }: { kind?: ProductKind }) {
  const { t } = useLang();
  if (kind !== "fresh" && kind !== "artificial") return null;
  const style = kind === "fresh" ? "bg-sage-light text-sage-dark" : "bg-amber-100 text-amber-800";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${style}`}>
      {t(kind === "fresh" ? "kind.fresh" : "kind.artificial")}
    </span>
  );
}

/** "Good for: 🛬 Welcome home · 🛫 Farewell" on the product page. */
export function OccasionTags({ tags }: { tags?: Occasion[] }) {
  const { t } = useLang();
  if (!tags || tags.length === 0) return null;
  return (
    <p className="mt-3 text-sm text-charcoal/70">
      <span className="font-medium text-charcoal">{t("occ.goodFor")}</span>{" "}
      {tags.map((o) => `${OCCASION_EMOJI[o]} ${t(`occ.${o}`)}`).join("   ")}
    </p>
  );
}
