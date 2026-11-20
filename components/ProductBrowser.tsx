"use client";

import { useMemo, useState } from "react";
import { Bouquet, Occasion, OCCASIONS, OCCASION_EMOJI, ProductKind, productKind } from "@/lib/types";
import BouquetCard from "./BouquetCard";
import { useLang } from "./LanguageProvider";

type PriceBand = "any" | "u500" | "500-1000" | "o1000";
type SortKey = "default" | "low" | "high";
type KindFilter = "all" | ProductKind;
type OccasionFilter = "all" | Occasion;

const inBand = (price: number, band: PriceBand) =>
  band === "any" ||
  (band === "u500" && price < 500) ||
  (band === "500-1000" && price >= 500 && price <= 1000) ||
  (band === "o1000" && price > 1000);

const KIND_ORDER: ProductKind[] = ["fresh", "artificial", "other"];

/**
 * Search, type (fresh / artificial / khata & flags), occasion, price filter and
 * sort for the product grid, plus a "Popular" strip (products the admin marked
 * as featured). Everything runs in the browser on the list the server already
 * sent — no extra requests. Filter chips only appear when they would actually
 * change what is shown.
 */
export default function ProductBrowser({
  available,
  soldOut,
  allowPopular,
  initialKind = "all",
  initialOccasion = "all",
}: {
  available: Bouquet[];
  soldOut: Bouquet[];
  allowPopular: boolean;
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
  const kindsPresent = KIND_ORDER.filter((k) => everything.some((b) => productKind(b) === k));
  const occasionsPresent = OCCASIONS.filter((o) => everything.some((b) => b.tags?.includes(o)));

  const filtering = query.trim() !== "" || band !== "any" || sort !== "default" || kind !== "all" || occasion !== "all";

  const apply = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (list: Bouquet[]) => {
      const out = list.filter(
        (b) =>
          inBand(b.price, band) &&
          (kind === "all" || productKind(b) === kind) &&
          (occasion === "all" || (b.tags || []).includes(occasion)) &&
          (q === "" || b.name.toLowerCase().includes(q) || (b.description || "").toLowerCase().includes(q))
      );
      if (sort === "low") out.sort((a, b) => a.price - b.price);
      if (sort === "high") out.sort((a, b) => b.price - a.price);
      return out;
    };
  }, [query, band, sort, kind, occasion]);

  const shownAvailable = apply(available);
  const shownSoldOut = apply(soldOut);
  const popular = allowPopular && !filtering
    ? available
        .filter((b) => b.featured)
        .sort((a, b) => (a.featuredOrder || 99) - (b.featuredOrder || 99))
        .slice(0, 4)
    : [];

  const control = "rounded-md border border-sand bg-white px-3 py-2 text-sm";
  const chip = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
      active ? "border-charcoal bg-charcoal text-ivory" : "border-sand bg-white text-charcoal hover:border-rose"
    }`;

  return (
    <div>
      {kindsPresent.length > 1 && (
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

      {kind === "artificial" && (
        <p className="mt-4 rounded-card bg-amber-50 px-4 py-3 text-sm text-amber-900">{t("kind.artificialNote")}</p>
      )}
      {kind === "fresh" && (
        <p className="mt-4 rounded-card bg-sage-light px-4 py-3 text-sm text-sage-dark">{t("kind.freshNote")}</p>
      )}

      {popular.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl italic text-charcoal">{t("cat.popular")}</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {popular.map((b) => (
              <BouquetCard key={`pop-${b.id}`} bouquet={b} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        {popular.length > 0 && (
          <h2 className="font-display text-xl italic text-charcoal">{t("cat.allProducts")}</h2>
        )}
        {shownAvailable.length === 0 && shownSoldOut.length === 0 ? (
          <p className="mt-6 rounded-card border border-sand bg-white p-6 text-center text-sm text-charcoal/60">
            {t("cat.noResults")}
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
