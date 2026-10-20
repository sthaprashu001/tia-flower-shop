"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useLang } from "@/components/LanguageProvider";
import { MyOrder, loadMyOrders } from "@/lib/myOrders";
import { formatPickup } from "@/lib/time";
import { OrderStatus } from "@/lib/types";

interface TrackedOrder {
  orderNumber: string;
  firstName: string;
  items: { bouquetId: string; quantity: number; name?: string; unitPrice?: number }[];
  date: string;
  time: string;
  meetingLocation: string;
  customizationNote?: string;
  total: number;
  status: OrderStatus;
}

const STEPS: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY", "DELIVERED"];
const REFRESH_MS = 45_000;
const FINISHED: OrderStatus[] = ["DELIVERED", "CANCELLED", "REJECTED"];

const BADGE: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PREPARING: "bg-purple-100 text-purple-800",
  READY: "bg-green-100 text-green-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
  REJECTED: "bg-red-100 text-red-800",
};

export default function TrackOrderPage() {
  const { t, lang } = useLang();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [recent, setRecent] = useState<MyOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const current = useRef<{ orderNumber: string; phone: string } | null>(null);

  const lookup = useCallback(
    async (num: string, ph: string, quiet = false) => {
      if (!num.trim() || !ph.trim()) {
        setError(t("track.enterBoth"));
        return;
      }
      if (!quiet) {
        setLoading(true);
        setError("");
      }
      try {
        const res = await fetch(
          `/api/orders/track?orderNumber=${encodeURIComponent(num.trim())}&phone=${encodeURIComponent(ph.trim())}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = await res.json();
          setOrder(data.order);
          setUpdatedAt(new Date());
          current.current = { orderNumber: num.trim(), phone: ph.trim() };
          setError("");
        } else if (!quiet) {
          setOrder(null);
          setError(res.status === 404 ? t("track.notFound") : res.status === 429 ? t("track.tooMany") : t("track.failed"));
        }
      } catch {
        if (!quiet) setError(t("track.failed"));
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [t]
  );

  // On arrival: show this device's recent orders and, if we were sent here for
  // a specific order (?order=...) or there's a latest one, load it straight away.
  useEffect(() => {
    const mine = loadMyOrders();
    setRecent(mine);
    const wanted = new URLSearchParams(window.location.search).get("order");
    const pick = (wanted && mine.find((o) => o.orderNumber === wanted)) || mine[0];
    if (pick) {
      setOrderNumber(pick.orderNumber);
      setPhone(pick.phone);
      lookup(pick.orderNumber, pick.phone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the status fresh while the tab is open — no need to press refresh.
  useEffect(() => {
    if (!order || FINISHED.includes(order.status)) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible" && current.current) {
        lookup(current.current.orderNumber, current.current.phone, true);
      }
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [order, lookup]);

  const locale = lang === "ne" ? "ne-NP" : "en-GB";
  const stepIndex = order ? STEPS.indexOf(order.status) : -1;
  const inputCls = "mt-1 w-full rounded-md border border-sand px-4 py-2.5 placeholder:text-charcoal/30";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 text-center">
        <h1 className="font-display text-3xl italic text-charcoal">{t("track.title")}</h1>
        <p className="mt-2 text-sm text-charcoal/70">{t("track.intro")}</p>
      </div>

      {recent.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-charcoal/50">{t("track.recent")}</p>
          <div className="flex flex-wrap gap-2">
            {recent.map((o) => (
              <button
                key={o.orderNumber}
                type="button"
                onClick={() => {
                  setOrderNumber(o.orderNumber);
                  setPhone(o.phone);
                  lookup(o.orderNumber, o.phone);
                }}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                  order?.orderNumber === o.orderNumber ? "border-rose bg-rose-light text-rose-dark" : "border-sand bg-white text-charcoal hover:border-rose"
                }`}
              >
                #{o.orderNumber}
                <span className="ml-2 font-normal text-charcoal/60">{formatPickup(o.date, o.time, locale)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookup(orderNumber, phone);
        }}
        className="mb-8 space-y-4 rounded-card border border-sand bg-sand/30 p-5"
      >
        <div>
          <label className="text-sm font-semibold text-charcoal/70" htmlFor="orderNumber">
            {t("track.orderNumber")}
          </label>
          <input
            id="orderNumber"
            type="text"
            autoCapitalize="characters"
            autoComplete="off"
            placeholder="TIA12345678"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
            className={inputCls}
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-charcoal/70" htmlFor="trackPhone">
            {t("track.phone")}
          </label>
          <input
            id="trackPhone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="98XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputCls}
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-rose py-3 font-semibold text-white hover:bg-rose-dark disabled:opacity-50"
        >
          {loading ? t("track.searching") : t("track.submit")}
        </button>
      </form>

      {order && (
        <div className="space-y-5" aria-live="polite">
          <div className="text-center">
            {order.firstName && <p className="text-sm text-charcoal/70">{t("track.hi", { name: order.firstName })}</p>}
            <span className={`mt-1 inline-block rounded-full px-4 py-2 font-semibold ${BADGE[order.status]}`}>
              {t(`status.${order.status}`)}
            </span>
            <p className="mt-3 text-sm text-charcoal/80">{t(`track.msg.${order.status}`)}</p>
          </div>

          {order.status === "READY" && (
            <div className="rounded-card border border-green-300 bg-green-50 p-4 text-center">
              <p className="font-semibold text-green-800">{t("track.readyTitle")}</p>
              <p className="mt-1 text-sm text-green-700">
                {order.meetingLocation} · {order.time}
              </p>
            </div>
          )}

          {stepIndex >= 0 && (
            <ol className="flex items-start rounded-card border border-sand bg-white p-4" aria-label={t("track.title")}>
              {STEPS.map((step, idx) => {
                const done = idx <= stepIndex;
                return (
                  <li key={step} className="flex flex-1 flex-col items-center text-center" aria-current={idx === stepIndex ? "step" : undefined}>
                    <div className="flex w-full items-center">
                      <span className={`h-0.5 flex-1 ${idx === 0 ? "bg-transparent" : idx <= stepIndex ? "bg-green-500" : "bg-sand"}`} />
                      <span
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          done ? "bg-green-500 text-white" : "bg-sand text-charcoal/50"
                        } ${idx === stepIndex ? "ring-4 ring-green-200" : ""}`}
                      >
                        {done ? "✓" : idx + 1}
                      </span>
                      <span className={`h-0.5 flex-1 ${idx === STEPS.length - 1 ? "bg-transparent" : idx < stepIndex ? "bg-green-500" : "bg-sand"}`} />
                    </div>
                    <span className={`mt-1 text-[11px] leading-tight ${done ? "font-semibold text-charcoal" : "text-charcoal/50"}`}>
                      {t(`status.short.${step}`)}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          <div className="rounded-card border border-sand bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-charcoal">{t("track.details")}</h2>
              <span className="font-mono text-xs text-charcoal/60">#{order.orderNumber}</span>
            </div>
            <ul className="space-y-1 text-sm">
              {order.items.map((i, idx) => (
                <li key={idx} className="flex justify-between">
                  <span>
                    {i.name || i.bouquetId} × {i.quantity}
                  </span>
                  {i.unitPrice !== undefined && <span className="font-mono">Rs. {(i.unitPrice * i.quantity).toLocaleString("en-IN")}</span>}
                </li>
              ))}
              <li className="mt-2 flex justify-between border-t border-sand pt-2 font-semibold">
                <span>{t("order.total")}</span>
                <span className="font-mono text-rose-dark">Rs. {order.total.toLocaleString("en-IN")}</span>
              </li>
            </ul>
            <dl className="mt-4 grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-charcoal/60">{t("track.pickup")}</dt>
              <dd className="text-right font-medium">{formatPickup(order.date, order.time, locale)}</dd>
              <dt className="text-charcoal/60">{t("track.place")}</dt>
              <dd className="text-right font-medium">{order.meetingLocation}</dd>
              {order.customizationNote && (
                <>
                  <dt className="text-charcoal/60">{t("track.note")}</dt>
                  <dd className="text-right">{order.customizationNote}</dd>
                </>
              )}
            </dl>
          </div>

          <div className="flex items-center justify-between text-xs text-charcoal/50">
            <span>
              {updatedAt && !FINISHED.includes(order.status)
                ? t("track.updated", { time: updatedAt.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }) })
                : ""}
            </span>
            <button
              type="button"
              onClick={() => current.current && lookup(current.current.orderNumber, current.current.phone)}
              className="font-semibold text-rose-dark hover:underline"
            >
              {t("track.refresh")}
            </button>
          </div>
        </div>
      )}

      {!order && !loading && (
        <div className="rounded-card border border-sand bg-sand/10 p-6 text-center">
          <p className="text-sm text-charcoal/70">{t("track.noNumber")}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <WhatsAppButton label={t("track.whatsapp")} message="Hi! I can't find my order number." />
            <Link href="/contact" className="rounded-full border border-charcoal/20 px-5 py-2.5 text-sm font-semibold text-charcoal hover:border-rose">
              {t("nav.contact")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
