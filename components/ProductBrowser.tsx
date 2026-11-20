"use client";

import { useMemo, useState } from "react";
import { Bouquet } from "@/lib/types";
import BouquetCard from "./BouquetCard";
import { useLang } from "./LanguageProvider";

type SortKey = "default" | "low" | "high";

/**
 * Search and sort for the product grid.
 *
 * The lists arrive already in the admin's chosen order (position numbers), and
 * "Recommended" keeps that order — only choosing a price sort changes it.
 */
export default function ProductBrowser({ available, soldOut }: { available: Bouquet[]; soldOut: Bouquet[] }) {
  const { t } = useLang();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("default");

  const apply = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (list: Bouquet[]) => {
      const out = list.filter(
        (b) => q === "" || b.name.toLowerCase().includes(q) || (b.description || "").toLowerCase().includes(q)
      );
      if (sort === "low") out.sort((a, b) => a.price - b.price);
      if (sort === "high") out.sort((a, b) => b.price - a.price);
      return out;
    };
  }, [query, sort]);

  const shownAvailable = apply(available);
  const shownSoldOut = apply(soldOut);

  const control = "rounded-md border border-sand bg-white px-3 py-2 text-sm";

  return (
    <div>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("cat.search")}
          aria-label={t("cat.search")}
          className={`${control} flex-1`}
        />
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={control} aria-label={t("cat.sort")}>
          <option value="default">{t("cat.sortDefault")}</option>
          <option value="low">{t("cat.sortLow")}</option>
          <option value="high">{t("cat.sortHigh")}</option>
        </select>
      </div>

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
