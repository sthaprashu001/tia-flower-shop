"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Bouquet } from "@/lib/types";
import { useCart } from "@/components/CartProvider";
import { useLang } from "@/components/LanguageProvider";
import TimeSlotPicker from "@/components/TimeSlotPicker";
import { leadTimeText } from "@/lib/i18n";
import {
  SHOP_UTC_OFFSET_MINUTES,
  addDaysIso,
  earliestPickupMs,
  formatPickup,
  maxLeadHours,
  shopToday,
} from "@/lib/time";

const CUSTOMER_KEY = "tia-customer"; // name / phone / meeting point, saved on this device only
const LAST_ITEMS_KEY = "tia-last-items"; // items of the previous order, for "order the same again"
const MIN_NOTICE_MINUTES = 30; // shortest time we need to prepare anything

interface SlotData {
  counts: Record<string, number>;
}

function OrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("bouquet");
  const { items, hydrated, addItem, removeItem, setQuantity, clear } = useCart();
  const { t, lang } = useLang();

  const [bouquets, setBouquets] = useState<Bouquet[]>([]);
  const [loadingBouquets, setLoadingBouquets] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [customizationNote, setCustomizationNote] = useState("");
  const [showExtras, setShowExtras] = useState(false);
  const [remember, setRemember] = useState(true);
  const [hasSaved, setHasSaved] = useState(false);
  const [lastItems, setLastItems] = useState<{ bouquetId: string; quantity: number }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Shop settings (opening hours, hourly limit, OPEN/BUSY/CLOSED) and the booked hours of the chosen date.
  const [settings, setSettings] = useState({ status: "OPEN", openHour: 6, closeHour: 22, capacityPerHour: 8 });
  const [slotData, setSlotData] = useState<SlotData>({ counts: {} });
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setBouquets(data.products || []))
      .catch(() => setError(t("order.loadError")))
      .finally(() => setLoadingBouquets(false));
    fetch("/api/shop-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.openHour === "number") setSettings((s) => ({ ...s, ...data }));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep "now" fresh so slots that pass while the form is open grey out.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Details remembered from the last order on this device (convenience only).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CUSTOMER_KEY) || "null");
      if (saved && typeof saved === "object") {
        setCustomerName(typeof saved.customerName === "string" ? saved.customerName : "");
        setPhone(typeof saved.phone === "string" ? saved.phone : "");
        setMeetingLocation(typeof saved.meetingLocation === "string" ? saved.meetingLocation : "");
        setHasSaved(Boolean(saved.customerName || saved.phone));
      }
      const last = JSON.parse(localStorage.getItem(LAST_ITEMS_KEY) || "[]");
      if (Array.isArray(last)) setLastItems(last.filter((i) => i && typeof i.bouquetId === "string" && i.quantity > 0));
    } catch {
      // Unreadable saved data — just start with an empty form.
    }
  }, []);

  // Backward-compat: a bouquet detail page (or old link) can still land here
  // with ?bouquet=<id> — add it to the cart once, on first load.
  useEffect(() => {
    if (preselected && hydrated && !items.some((i) => i.bouquetId === preselected)) {
      addItem(preselected, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselected, hydrated]);

  const lines = items
    .map((item) => {
      const bouquet = bouquets.find((b) => b.id === item.bouquetId);
      return bouquet ? { ...item, bouquet } : null;
    })
    .filter((l): l is { bouquetId: string; quantity: number; bouquet: Bouquet } => l !== null);

  const total = lines.reduce((sum, l) => sum + l.bouquet.price * l.quantity, 0);
  const cartEmpty = hydrated && !loadingBouquets && lines.length === 0;
  const unavailable = lines.filter((l) => !l.bouquet.available);
  const hasCustomizable = lines.some((l) => l.bouquet.customizable);

  // Longest "order at least X before" among the items in the cart.
  const leadHours = maxLeadHours(lines.map((l) => l.bouquet));
  const leadProduct = lines.find((l) => (l.bouquet.leadTimeHours || 0) === leadHours && leadHours > 0)?.bouquet.name;
  const earliestMs = Math.max(
    earliestPickupMs(now, leadHours),
    now + MIN_NOTICE_MINUTES * 60_000
  );
  const earliestShop = new Date(earliestMs + SHOP_UTC_OFFSET_MINUTES * 60_000).toISOString();
  const minDate = earliestShop.slice(0, 10) > shopToday(now) ? earliestShop.slice(0, 10) : shopToday(now);
  const maxDate = addDaysIso(shopToday(now), 90);

  // Open the optional section automatically when something in the cart can be customised.
  useEffect(() => {
    if (hasCustomizable) setShowExtras(true);
  }, [hasCustomizable]);

  // If the cart changes so the chosen date is now too early, move it forward.
  useEffect(() => {
    if (date && date < minDate) {
      setDate(minDate);
      setTime("");
    }
  }, [date, minDate]);

  // Booked hours for the chosen date.
  useEffect(() => {
    if (!date) return;
    let cancelled = false;
    setLoadingSlots(true);
    fetch(`/api/slots?date=${encodeURIComponent(date)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setSlotData({ counts: data.counts || {} });
        setSettings((s) => ({
          ...s,
          status: data.status ?? s.status,
          openHour: data.openHour ?? s.openHour,
          closeHour: data.closeHour ?? s.closeHour,
          capacityPerHour: data.capacityPerHour ?? s.capacityPerHour,
        }));
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoadingSlots(false));
    return () => {
      cancelled = true;
    };
  }, [date]);

  // A chosen time that just became invalid (e.g. an item was added) is cleared.
  const slotIsValid = useMemo(() => {
    if (!date || !time) return true;
    const [y, m, d] = date.split("-").map(Number);
    const [hh, mm] = time.split(":").map(Number);
    return Date.UTC(y, m - 1, d, hh, mm) - SHOP_UTC_OFFSET_MINUTES * 60_000 >= earliestMs;
  }, [date, time, earliestMs]);
  useEffect(() => {
    if (!slotIsValid) setTime("");
  }, [slotIsValid]);

  function reorderLast() {
    lastItems.forEach((i) => addItem(i.bouquetId, i.quantity));
  }

  function forgetMe() {
    try {
      localStorage.removeItem(CUSTOMER_KEY);
    } catch {
      // ignore
    }
    setCustomerName("");
    setPhone("");
    setMeetingLocation("");
    setHasSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuggestions([]);

    if (lines.length === 0) {
      setError(t("order.emptyCartError"));
      return;
    }
    if (unavailable.length > 0) {
      setError(t("order.unavailableError"));
      return;
    }
    if (!time) {
      setError(t("order.pickTimeError"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          phone,
          items: lines.map((l) => ({ bouquetId: l.bouquetId, quantity: l.quantity })),
          date,
          time,
          meetingLocation,
          customizationNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("order.genericError"));
        if (Array.isArray(data.suggestions)) setSuggestions(data.suggestions);
        setSubmitting(false);
        return;
      }

      try {
        sessionStorage.setItem("lastOrder", JSON.stringify(data.order));
        localStorage.setItem(
          LAST_ITEMS_KEY,
          JSON.stringify(lines.map((l) => ({ bouquetId: l.bouquetId, quantity: l.quantity })))
        );
        if (remember) {
          localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ customerName, phone, meetingLocation }));
        } else {
          localStorage.removeItem(CUSTOMER_KEY);
        }
      } catch {
        // Storage unavailable — the order itself is already saved.
      }
      clear();
      router.push("/order/confirmation");
    } catch {
      setError(t("order.networkError"));
      setSubmitting(false);
    }
  }

  const input = "mt-1 w-full rounded-md border border-sand px-3 py-2";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl italic text-charcoal">{t("order.title")}</h1>
      <p className="mt-2 text-charcoal/70">{t("order.intro")}</p>

      {settings.status !== "OPEN" && (
        <p
          className={`mt-4 rounded-card px-4 py-3 text-sm ${
            settings.status === "CLOSED" ? "bg-rose-light text-rose-dark" : "bg-amber-50 text-amber-900"
          }`}
        >
          {settings.status === "CLOSED" ? t("order.statusClosed") : t("order.statusBusy")}
        </p>
      )}

      {(loadingBouquets || !hydrated) && <p className="mt-6 text-sm text-charcoal/60">{t("order.loadingCart")}</p>}

      {cartEmpty && (
        <div className="mt-8 rounded-card border border-sand bg-white p-8 text-center">
          <p className="text-charcoal/70">{t("cart.empty")}</p>
          <div className="mt-4 flex flex-col items-center gap-2">
            <Link
              href="/bouquets"
              className="inline-block rounded-full bg-rose px-6 py-2.5 text-sm font-semibold text-ivory hover:bg-rose-dark"
            >
              {t("cart.browse")}
            </Link>
            {lastItems.length > 0 && (
              <button
                type="button"
                onClick={reorderLast}
                className="text-sm font-semibold text-rose-dark hover:underline"
              >
                {t("order.orderAgain")}
              </button>
            )}
          </div>
        </div>
      )}

      {lines.length > 0 && (
        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          {/* Cart summary */}
          <fieldset>
            <legend className="font-display text-lg text-charcoal">{t("order.yourBouquets")}</legend>
            <div className="mt-3 space-y-2">
              {lines.map(({ bouquetId, quantity, bouquet }) => (
                <div
                  key={bouquetId}
                  className={`rounded-card border bg-white p-3 ${bouquet.available ? "border-sand" : "border-rose bg-rose-light/40"}`}
                >
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={bouquet.image} alt={bouquet.name} className="h-14 w-14 flex-shrink-0 rounded-md object-cover" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-charcoal">{bouquet.name}</p>
                      <p className="font-mono text-xs text-charcoal/60">Rs. {bouquet.price.toLocaleString("en-IN")}</p>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={quantity}
                      onChange={(e) => setQuantity(bouquetId, Number(e.target.value))}
                      className="w-16 rounded-md border border-sand px-2 py-1 text-center"
                      aria-label={`${t("order.quantityFor")} ${bouquet.name}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(bouquetId)}
                      aria-label={`${t("order.remove")} ${bouquet.name}`}
                      className="text-charcoal/40 hover:text-rose-dark"
                    >
                      ✕
                    </button>
                  </div>
                  {!bouquet.available && (
                    <p className="mt-2 text-xs font-semibold text-rose-dark">{t("order.itemUnavailable")}</p>
                  )}
                  {bouquet.available && (bouquet.leadTimeHours || 0) > 0 && (
                    <p className="mt-2 text-xs text-amber-800">
                      ⏰ {t("detail.leadNotice", { time: leadTimeText(lang, bouquet.leadTimeHours || 0) })}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <Link href="/bouquets" className="mt-3 inline-block text-sm text-rose-dark hover:underline">
              {t("order.addMore")}
            </Link>
          </fieldset>

          {/* Contact */}
          <fieldset className="space-y-3">
            <legend className="font-display text-lg text-charcoal">{t("order.yourDetails")}</legend>
            {hasSaved && (
              <p className="text-xs text-charcoal/60">
                {t("order.savedDetails")}{" "}
                <button type="button" onClick={forgetMe} className="font-semibold text-rose-dark hover:underline">
                  {t("order.clearSaved")}
                </button>
              </p>
            )}
            <div>
              <label className="text-sm font-medium text-charcoal" htmlFor="customerName">
                {t("order.fullName")}
              </label>
              <input
                id="customerName"
                required
                maxLength={100}
                autoComplete="name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={input}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-charcoal" htmlFor="phone">
                {t("order.phone")}
              </label>
              <input
                id="phone"
                required
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98XXXXXXXX"
                className={input}
              />
            </div>
          </fieldset>

          {/* Timing & location */}
          <fieldset className="space-y-3">
            <legend className="font-display text-lg text-charcoal">{t("order.whenWhere")}</legend>

            {leadHours > 0 && (
              <p className="rounded-card bg-amber-50 px-4 py-3 text-sm text-amber-900">
                ⏰{" "}
                {t("order.leadCartNotice", {
                  product: leadProduct || "",
                  time: leadTimeText(lang, leadHours),
                  earliest: formatPickup(earliestShop.slice(0, 10), earliestShop.slice(11, 16), lang === "ne" ? "ne-NP" : "en-GB"),
                })}
              </p>
            )}

            <div>
              <label className="text-sm font-medium text-charcoal" htmlFor="date">
                {t("order.date")}
              </label>
              <input
                id="date"
                required
                type="date"
                min={minDate}
                max={maxDate}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setTime("");
                }}
                className={`${input} sm:max-w-xs`}
              />
            </div>

            <div>
              <p className="text-sm font-medium text-charcoal">{t("order.time")}</p>
              <div className="mt-2">
                <TimeSlotPicker
                  date={date}
                  value={time}
                  onChange={(v) => {
                    setTime(v);
                    setSuggestions([]);
                    setError(null);
                  }}
                  openHour={settings.openHour}
                  closeHour={settings.closeHour}
                  capacityPerHour={settings.capacityPerHour}
                  counts={slotData.counts}
                  earliestMs={earliestMs}
                  loading={loadingSlots}
                />
              </div>
              <p className="mt-2 text-xs text-charcoal/60">{t("order.timeHint")}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-charcoal" htmlFor="meetingLocation">
                {t("order.meetingPoint")}
              </label>
              <input
                id="meetingLocation"
                required
                maxLength={200}
                value={meetingLocation}
                onChange={(e) => setMeetingLocation(e.target.value)}
                placeholder={t("order.meetingPlaceholder")}
                className={input}
              />
              <p className="mt-1 text-xs text-charcoal/60">{t("order.meetingHint")}</p>
            </div>
          </fieldset>

          {/* Customization & message — optional, collapsed unless something in the cart is customisable */}
          <fieldset className="space-y-3">
            <button
              type="button"
              onClick={() => setShowExtras((v) => !v)}
              aria-expanded={showExtras}
              className="flex w-full items-center justify-between font-display text-lg text-charcoal"
            >
              <span>{t("order.customize")}</span>
              <span className="text-sm text-rose-dark">{showExtras ? t("order.hide") : t("order.show")}</span>
            </button>
            {showExtras && (
              <div>
                <label className="text-sm font-medium text-charcoal" htmlFor="customizationNote">
                  {t("order.specialRequests")}
                </label>
                <textarea
                  id="customizationNote"
                  value={customizationNote}
                  maxLength={500}
                  onChange={(e) => setCustomizationNote(e.target.value)}
                  rows={3}
                  placeholder=""
                  className={input}
                />
              </div>
            )}
          </fieldset>

          {/* Total & submit */}
          <div className="rounded-card border border-sand bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-charcoal">{t("order.total")}</span>
              <span className="font-mono text-lg font-bold text-rose-dark">Rs. {total.toLocaleString("en-IN")}</span>
            </div>
            <p className="mt-1 text-xs text-charcoal/60">{t("order.paymentNote")}</p>
          </div>

          <label className="flex items-center gap-2 text-sm text-charcoal/70">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            {t("order.remember")}
          </label>

          {error && (
            <div className="rounded-card bg-rose-light px-4 py-3 text-sm text-rose-dark" role="alert">
              <p>{error}</p>
              {suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setTime(s);
                        setError(null);
                        setSuggestions([]);
                        // Refresh booked hours so the picker reflects reality.
                        fetch(`/api/slots?date=${encodeURIComponent(date)}`)
                          .then((r) => (r.ok ? r.json() : null))
                          .then((d) => d && setSlotData({ counts: d.counts || {} }))
                          .catch(() => {});
                      }}
                      className="rounded-full bg-white px-3 py-1 font-semibold text-charcoal shadow-sm hover:bg-sand"
                    >
                      {t("order.useTime", { time: s })}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || unavailable.length > 0}
            className="w-full rounded-full bg-rose px-6 py-3 text-sm font-semibold text-ivory transition hover:bg-rose-dark disabled:opacity-60"
          >
            {submitting ? t("order.submitting") : t("order.submit")}
          </button>
        </form>
      )}
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={null}>
      <OrderForm />
    </Suspense>
  );
}
