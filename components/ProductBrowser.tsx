"use client";

import { useMemo, useState } from "react";
import { Bouquet, Occasion, OCCASIONS, OCCASION_EMOJI, ProductKind, productKind } from "@/lib/types";
import BouquetCard from "./BouquetCard";
import { useLang } from "./LanguageProvider";

type PriceBand = "any" | "u500" | "500-1000" | "o1000";
type SortKey = "default" | "low" | "high";
type KindFilter = "all" | ProductKind;
type OccasionFilter = "all" | Occasion;
export type BouquetTab = "natural" | "artificial" | "more";

const inBand = (price: number, band: PriceBand) =>
  band === "any" ||
  (band === "u500" && price < 500) ||
  (band === "500-1000" && price >= 500 && price <= 1000) ||
  (band === "o1000" && price > 1000);

const KIND_ORDER: ProductKind[] = ["fresh", "artificial", "other"];

/** Which Bouquets tab a product belongs to. Unclassified ones go to "more", never to "natural". */
const tabOf = (b: Bouquet): BouquetTab => {
  const k = productKind(b);
  return k === "fresh" ? "natural" : k === "artificial" ? "artificial" : "more";
};

/**
 * Search, type, occasion, price filter and sort for the product grid.
 *
 * The lists arrive already in the admin's chosen order (position numbers), and
 * "Recommended" keeps that order — only choosing a price sort changes it.
 *
 * When the Bouquets category is open (`bouquetTabs`), the type chips are replaced
 * by Natural / Artificial tabs (Natural by default). A third "More bouquets" tab
 * appears only if some bouquets have no type set yet.
 */
export default function ProductBrowser({
  available,
  soldOut,
  bouquetTabs = false,
  initialTab,
  initialKind = "all",
  initialOccasion = "all",
}: {
  available: Bouquet[];
  soldOut: Bouquet[];
  bouquetTabs?: boolean;
  initialTab?: BouquetTab;
  initialKind?: KindFilter;
  initialOccasion?: OccasionFilter;
}) {
  const { t } = useLang();
  const [query, setQuery] = useState("");
  const [band, setBand] = useState<PriceBand>("any");
  const [sort, setSort] = useState<SortKey>("default");
  const [kind, setKind] = useState<KindFilter>(initialKind);
  const [occasion, setOccasion] = useState<OccasionFilter>(initialOccasion);

  const everything = useMemo(() => [...available, ...soldOut], [available, soldOut]);

  const tabCounts = useMemo(() => {
    const c: Record<BouquetTab, number> = { natural: 0, artificial: 0, more: 0 };
    everything.forEach((b) => c[tabOf(b)]++);
    return c;
  }, [everything]);

  // Natural is the default tab. Only if it is completely empty do we open the next one with products.
  const [tab, setTab] = useState<BouquetTab>(() => {
    if (initialTab && (initialTab !== "more" || tabCounts.more > 0)) return initialTab;
    if (tabCounts.natural === 0 && tabCounts.artificial > 0) return "artificial";
    return "natural";
  });
  const tabs: BouquetTab[] = tabCounts.more > 0 ? ["natural", "artificial", "more"] : ["natural", "artificial"];

  const kindsPresent = KIND_ORDER.filter((k) => everything.some((b) => productKind(b) === k));
  const occasionsPresent = OCCASIONS.filter((o) => everything.some((b) => b.tags?.includes(o)));

  const activeKind: KindFilter = bouquetTabs ? "all" : kind;

  const apply = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (list: Bouquet[]) => {
      const out = list.filter(
        (b) =>
          (!bouquetTabs || tabOf(b) === tab) &&
          inBand(b.price, band) &&
          (activeKind === "all" || productKind(b) === activeKind) &&
          (occasion === "all" || (b.tags || []).includes(occasion)) &&
          (q === "" || b.name.toLowerCase().includes(q) || (b.description || "").toLowerCase().includes(q))
      );
      if (sort === "low") out.sort((a, b) => a.price - b.price);
      if (sort === "high") out.sort((a, b) => b.price - a.price);
      return out;
    };
  }, [query, band, sort, activeKind, occasion, bouquetTabs, tab]);

  const shownAvailable = apply(available);
  const shownSoldOut = apply(soldOut);

  // Short explanation under the chips / tabs.
  const noteKind: ProductKind | null = bouquetTabs
    ? tab === "natural"
      ? "fresh"
      : tab === "artificial"
      ? "artificial"
      : null
    : activeKind === "fresh" || activeKind === "artificial"
    ? activeKind
    : null;

  const control = "rounded-md border border-sand bg-white px-3 py-2 text-sm";
  const chip = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
      active ? "border-charcoal bg-charcoal text-ivory" : "border-sand bg-white text-charcoal hover:border-rose"
    }`;

  return (
    <div>
      {bouquetTabs && (
        <div
          role="tablist"
          aria-label={t("tab.label")}
          className="mt-6 inline-flex flex-wrap gap-1 rounded-full border border-sand bg-white p-1"
        >
          {tabs.map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                tab === k ? "bg-charcoal text-ivory" : "text-charcoal hover:text-rose"
              }`}
            >
              {t(`tab.${k}`)} <span className="ml-1 opacity-60">({tabCounts[k]})</span>
            </button>
          ))}
        </div>
      )}

      {!bouquetTabs && kindsPresent.length > 1 && (
        <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label={t("kind.title")}>
          <button type="button" onClick={() => setKind("all")} aria-pressed={kind === "all"} className={chip(kind === "all")}>
            {t("kind.all")}
          </button>
          {kindsPresent.map((k) => (
            <button key={k} type="button" onClick={() => setKind(k)} aria-pressed={kind === k} className={chip(kind === k)}>
              {t(`kind.${k}`)}
            </button>
          ))}
        </div>
      )}

      {occasionsPresent.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label={t("occ.title")}>
          <button
            type="button"
            onClick={() => setOccasion("all")}
            aria-pressed={occasion === "all"}
            className={chip(occasion === "all")}
          >
            {t("occ.all")}
          </button>
          {occasionsPresent.map((o) => (
            <button key={o} type="button" onClick={() => setOccasion(o)} aria-pressed={occasion === o} className={chip(occasion === o)}>
              {OCCASION_EMOJI[o]} {t(`occ.${o}`)}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("cat.search")}
          aria-label={t("cat.search")}
          className={`${control} flex-1`}
        />
        <select value={band} onChange={(e) => setBand(e.target.value as PriceBand)} className={control} aria-label={t("cat.price")}>
          <option value="any">{t("cat.priceAny")}</option>
          <option value="u500">{t("cat.priceU500")}</option>
          <option value="500-1000">{t("cat.price500")}</option>
          <option value="o1000">{t("cat.priceO1000")}</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={control} aria-label={t("cat.sort")}>
          <option value="default">{t("cat.sortDefault")}</option>
          <option value="low">{t("cat.sortLow")}</option>
          <option value="high">{t("cat.sortHigh")}</option>
        </select>
      </div>

      {noteKind === "artificial" && (
        <p className="mt-4 rounded-card bg-amber-50 px-4 py-3 text-sm text-amber-900">{t("kind.artificialNote")}</p>
      )}
      {noteKind === "fresh" && (
        <p className="mt-4 rounded-card bg-sage-light px-4 py-3 text-sm text-sage-dark">{t("kind.freshNote")}</p>
      )}

      <section className="mt-8">
        {shownAvailable.length === 0 && shownSoldOut.length === 0 ? (
          <p className="mt-6 rounded-card border border-sand bg-white p-6 text-center text-sm text-charcoal/60">
            {t("cat.noResults")}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {shownAvailable.map((b) => (
              <BouquetCard key={b.id} bouquet={b} />
            ))}
          </div>
        )}
      </section>

      {shownSoldOut.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-xl italic text-charcoal/70">{t("cat.unavailable")}</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {shownSoldOut.map((b) => (
              <BouquetCard key={b.id} bouquet={b} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
