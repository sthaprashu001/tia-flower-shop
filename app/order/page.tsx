"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Bouquet } from "@/lib/types";
import { useCart } from "@/components/CartProvider";

function OrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("bouquet");
  const { items, hydrated, addItem, removeItem, setQuantity, clear } = useCart();

  const [bouquets, setBouquets] = useState<Bouquet[]>([]);
  const [loadingBouquets, setLoadingBouquets] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [customizationNote, setCustomizationNote] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setBouquets(data.products || []))
      .catch(() => setError("Could not load bouquets. Please refresh the page."))
      .finally(() => setLoadingBouquets(false));
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (lines.length === 0) {
      setError("Your cart is empty — add a bouquet first.");
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
          personalMessage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      sessionStorage.setItem("lastOrder", JSON.stringify(data.order));
      clear();
      router.push("/order/confirmation");
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl italic text-charcoal">Place an order</h1>
      <p className="mt-2 text-charcoal/70">
        Fill in the details below. We'll confirm your order on WhatsApp
        shortly after you submit it.
      </p>

      {(loadingBouquets || !hydrated) && (
        <p className="mt-6 text-sm text-charcoal/60">Loading your cart…</p>
      )}

      {cartEmpty && (
        <div className="mt-8 rounded-card border border-sand bg-white p-8 text-center">
          <p className="text-charcoal/70">Your cart is empty.</p>
          <Link
            href="/bouquets"
            className="mt-4 inline-block rounded-full bg-rose px-6 py-2.5 text-sm font-semibold text-ivory hover:bg-rose-dark"
          >
            Browse bouquets
          </Link>
        </div>
      )}

      {lines.length > 0 && (
        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          {/* Cart summary */}
          <fieldset>
            <legend className="font-display text-lg text-charcoal">Your bouquets</legend>
            <div className="mt-3 space-y-2">
              {lines.map(({ bouquetId, quantity, bouquet }) => (
                <div key={bouquetId} className="flex items-center gap-3 rounded-card border border-sand bg-white p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bouquet.image}
                    alt={bouquet.name}
                    className="h-14 w-14 flex-shrink-0 rounded-md object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-charcoal">{bouquet.name}</p>
                    <p className="font-mono text-xs text-charcoal/60">
                      Rs. {bouquet.price.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(bouquetId, Number(e.target.value))}
                    className="w-16 rounded-md border border-sand px-2 py-1 text-center"
                    aria-label={`Quantity for ${bouquet.name}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(bouquetId)}
                    aria-label={`Remove ${bouquet.name}`}
                    className="text-charcoal/40 hover:text-rose-dark"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <Link href="/bouquets" className="mt-3 inline-block text-sm text-rose-dark hover:underline">
              + Add more bouquets
            </Link>
          </fieldset>

          {/* Contact */}
          <fieldset className="space-y-3">
            <legend className="font-display text-lg text-charcoal">Your details</legend>
            <div>
              <label className="text-sm font-medium text-charcoal" htmlFor="customerName">
                Full name
              </label>
              <input
                id="customerName"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1 w-full rounded-md border border-sand px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-charcoal" htmlFor="phone">
                Phone / WhatsApp number
              </label>
              <input
                id="phone"
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98XXXXXXXX"
                className="mt-1 w-full rounded-md border border-sand px-3 py-2"
              />
            </div>
          </fieldset>

          {/* Timing & location */}
          <fieldset className="space-y-3">
            <legend className="font-display text-lg text-charcoal">When &amp; where</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-charcoal" htmlFor="date">
                  Date
                </label>
                <input
                  id="date"
                  required
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-sand px-3 py-2"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-charcoal" htmlFor="time">
                  Time
                </label>
                <input
                  id="time"
                  required
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="mt-1 w-full rounded-md border border-sand px-3 py-2"
                />
              </div>
            </div>
            <p className="text-xs text-charcoal/60">
              Please allow at least 30–60 minutes so we can prepare it fresh.
            </p>
            <div>
              <label className="text-sm font-medium text-charcoal" htmlFor="meetingLocation">
                Meeting point near TIA
              </label>
              <input
                id="meetingLocation"
                required
                value={meetingLocation}
                onChange={(e) => setMeetingLocation(e.target.value)}
                placeholder="e.g. golden gate, bus stop, new terminal building"
                className="mt-1 w-full rounded-md border border-sand px-3 py-2"
              />
              <p className="mt-1 text-xs text-charcoal/60">
                We'll confirm the exact spot with you on WhatsApp.
              </p>
            </div>
          </fieldset>

          {/* Customization & message */}
          <fieldset className="space-y-3">
            <legend className="font-display text-lg text-charcoal">Customize (optional)</legend>
            <div>
              <label className="text-sm font-medium text-charcoal" htmlFor="customizationNote">
                Special requests
              </label>
              <textarea
                id="customizationNote"
                value={customizationNote}
                onChange={(e) => setCustomizationNote(e.target.value)}
                rows={3}
                placeholder='e.g. "10 red roses, white wrapping, blue ribbon"'
                className="mt-1 w-full rounded-md border border-sand px-3 py-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-charcoal" htmlFor="personalMessage">
                Personal message (goes on the card)
              </label>
              <textarea
                id="personalMessage"
                value={personalMessage}
                onChange={(e) => setPersonalMessage(e.target.value)}
                rows={2}
                placeholder="Welcome home! ❤️"
                className="mt-1 w-full rounded-md border border-sand px-3 py-2"
              />
            </div>
          </fieldset>

          {/* Total & submit */}
          <div className="rounded-card border border-sand bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-charcoal">Total</span>
              <span className="font-mono text-lg font-bold text-rose-dark">
                Rs. {total.toLocaleString("en-IN")}
              </span>
            </div>
            <p className="mt-1 text-xs text-charcoal/60">
              Payment is arranged with you on WhatsApp after we confirm — cash
              or online payment, no gateway needed right now.
            </p>
          </div>

          {error && (
            <p className="rounded-card bg-rose-light px-4 py-3 text-sm text-rose-dark">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-rose px-6 py-3 text-sm font-semibold text-ivory transition hover:bg-rose-dark disabled:opacity-60"
          >
            {submitting ? "Submitting..." : "Submit order"}
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
