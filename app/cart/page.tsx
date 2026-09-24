"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { useLang } from "@/components/LanguageProvider";
import { leadTimeText } from "@/lib/i18n";
import { Bouquet } from "@/lib/types";

export default function CartPage() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { items, hydrated, removeItem, setQuantity } = useCart();
  const [bouquets, setBouquets] = useState<Bouquet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setBouquets(data.products || []))
      .finally(() => setLoading(false));
  }, []);

  const lines = items
    .map((item) => {
      const bouquet = bouquets.find((b) => b.id === item.bouquetId);
      return bouquet ? { ...item, bouquet } : null;
    })
    .filter((l): l is { bouquetId: string; quantity: number; bouquet: Bouquet } => l !== null);

  const total = lines.reduce((sum, l) => sum + l.bouquet.price * l.quantity, 0);
  const isEmpty = hydrated && !loading && lines.length === 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl italic text-charcoal">{t("cart.title")}</h1>

      {(!hydrated || loading) && <p className="mt-6 text-sm text-charcoal/60">{t("cart.loading")}</p>}

      {isEmpty && (
        <div className="mt-8 rounded-card border border-sand bg-white p-8 text-center">
          <p className="text-charcoal/70">{t("cart.empty")}</p>
          <Link
            href="/bouquets"
            className="mt-4 inline-block rounded-full bg-rose px-6 py-2.5 text-sm font-semibold text-ivory hover:bg-rose-dark"
          >
            {t("cart.browse")}
          </Link>
        </div>
      )}

      {lines.length > 0 && (
        <>
          <div className="mt-6 space-y-3">
            {lines.map(({ bouquetId, quantity, bouquet }) => (
              <div key={bouquetId} className="flex items-center gap-3 rounded-card border border-sand bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={bouquet.image}
                  alt={bouquet.name}
                  className="h-16 w-16 flex-shrink-0 rounded-md object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium text-charcoal">{bouquet.name}</p>
                  <p className="font-mono text-sm text-charcoal/60">
                    Rs. {bouquet.price.toLocaleString("en-IN")}
                  </p>
                  {!bouquet.available && (
                    <p className="mt-1 text-xs font-semibold text-rose-dark">{t("order.itemUnavailable")}</p>
                  )}
                  {bouquet.available && (bouquet.leadTimeHours || 0) > 0 && (
                    <p className="mt-1 text-xs text-amber-800">
                      ⏰ {t("detail.leadNotice", { time: leadTimeText(lang, bouquet.leadTimeHours || 0) })}
                    </p>
                  )}
                </div>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(bouquetId, Number(e.target.value))}
                  className="w-16 rounded-md border border-sand px-2 py-1 text-center"
                  aria-label={`${t("order.quantityFor")} ${bouquet.name}`}
                />
                <button
                  onClick={() => removeItem(bouquetId)}
                  aria-label={`${t("order.remove")} ${bouquet.name}`}
                  className="text-charcoal/40 hover:text-rose-dark"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <Link href="/bouquets" className="mt-4 inline-block text-sm text-rose-dark hover:underline">
            {t("order.addMore")}
          </Link>

          <div className="mt-6 rounded-card border border-sand bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-charcoal">{t("order.total")}</span>
              <span className="font-mono text-lg font-bold text-rose-dark">
                Rs. {total.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <button
            onClick={() => router.push("/order")}
            className="mt-4 w-full rounded-full bg-rose px-6 py-3 text-sm font-semibold text-ivory transition hover:bg-rose-dark"
          >
            {t("cart.continue")}
          </button>
        </>
      )}
    </div>
  );
}
