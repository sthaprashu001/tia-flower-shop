"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { bouquets } from "@/lib/data";
import { OrderItem } from "@/lib/types";

function OrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselected = searchParams.get("bouquet");

  const [items, setItems] = useState<OrderItem[]>(
    preselected ? [{ bouquetId: preselected, quantity: 1 }] : []
  );
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [customizationNote, setCustomizationNote] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const available = bouquets.filter((b) => b.available);

  function toggleBouquet(id: string) {
    setItems((prev) => {
      const exists = prev.find((i) => i.bouquetId === id);
      if (exists) return prev.filter((i) => i.bouquetId !== id);
      return [...prev, { bouquetId: id, quantity: 1 }];
    });
  }

  function setQuantity(id: string, quantity: number) {
    setItems((prev) =>
      prev.map((i) => (i.bouquetId === id ? { ...i, quantity: Math.max(1, quantity) } : i))
    );
  }

  const total = items.reduce((sum, item) => {
    const b = bouquets.find((x) => x.id === item.bouquetId);
    return sum + (b ? b.price * item.quantity : 0);
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError("Please select at least one bouquet.");
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
          items,
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

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* Bouquet selection */}
        <fieldset>
          <legend className="font-display text-lg text-charcoal">Choose bouquets</legend>
          <div className="mt-3 space-y-2">
            {available.map((b) => {
              const selected = items.find((i) => i.bouquetId === b.id);
              return (
                <div
                  key={b.id}
                  className={`flex items-center justify-between rounded-card border px-4 py-3 ${
                    selected ? "border-rose bg-rose-light/30" : "border-sand"
                  }`}
                >
                  <label className="flex flex-1 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={Boolean(selected)}
                      onChange={() => toggleBouquet(b.id)}
                      className="h-4 w-4 accent-rose"
                    />
                    <span>
                      <span className="block text-sm font-medium text-charcoal">{b.name}</span>
                      <span className="block font-mono text-xs text-charcoal/60">
                        Rs. {b.price.toLocaleString("en-IN")}
                      </span>
                    </span>
                  </label>

                  {selected && (
                    <input
                      type="number"
                      min={1}
                      value={selected.quantity}
                      onChange={(e) => setQuantity(b.id, Number(e.target.value))}
                      className="w-16 rounded-md border border-sand px-2 py-1 text-center"
                      aria-label={`Quantity for ${b.name}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
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
              placeholder="e.g. Arrival gate, international terminal"
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
