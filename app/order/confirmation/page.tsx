"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useLang } from "@/components/LanguageProvider";
import { Order } from "@/lib/types";
import { formatPickup, pickupInstantMs } from "@/lib/time";
import { buildPickupIcs } from "@/lib/ics";

export default function ConfirmationPage() {
  const { t, lang } = useLang();
  const [order, setOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("lastOrder");
      if (raw) setOrder(JSON.parse(raw));
    } catch {
      // Unreadable — falls through to the "no recent order" message.
    }
  }, []);

  async function copyNumber() {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — the number is still on screen to copy by hand.
    }
  }

  // Hand the pickup to the phone's calendar app (with a reminder 1 hour before).
  function downloadCalendar() {
    if (!order) return;
    const ics = buildPickupIcs({
      orderNumber: order.orderNumber,
      startMs: pickupInstantMs(order.date, order.time),
      meetingLocation: order.meetingLocation,
      items: order.items.map((i) => `${i.name || i.bouquetId} x ${i.quantity}`),
    });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `flower-pickup-${order.orderNumber}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-2xl italic text-charcoal">{t("conf.noOrder")}</h1>
        <p className="mt-2 text-charcoal/70">{t("conf.noOrderHint")}</p>
        <Link
          href="/order"
          className="mt-6 inline-block rounded-full bg-rose px-6 py-3 text-sm font-semibold text-ivory hover:bg-rose-dark"
        >
          {t("conf.placeOrder")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-card border border-sand bg-white p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-sage-dark">{t("conf.received")}</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl italic text-charcoal">#{order.orderNumber}</h1>
          <button
            type="button"
            onClick={copyNumber}
            className="rounded-full border border-sand px-3 py-1 text-xs font-semibold text-charcoal hover:border-rose"
          >
            {copied ? t("conf.copied") : t("conf.copy")}
          </button>
        </div>
        <p className="mt-2 rounded-card bg-sage-light px-4 py-3 text-sm text-sage-dark">{t("conf.keepNumber")}</p>

        <div className="mt-6 space-y-1">
          {order.items.map((item) => (
            <div key={item.bouquetId} className="flex justify-between text-sm">
              <span>
                {item.name || item.bouquetId} × {item.quantity}
              </span>
              {item.unitPrice !== undefined && (
                <span className="font-mono">Rs. {(item.unitPrice * item.quantity).toLocaleString("en-IN")}</span>
              )}
            </div>
          ))}
          <div className="mt-2 flex justify-between border-t border-sand pt-2 font-semibold">
            <span>{t("order.total")}</span>
            <span className="font-mono text-rose-dark">Rs. {order.total.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-charcoal/60">{t("conf.pickup")}</dt>
          <dd>{formatPickup(order.date, order.time, lang === "ne" ? "ne-NP" : "en-GB")}</dd>
          <dt className="text-charcoal/60">{t("conf.meetingPoint")}</dt>
          <dd>{order.meetingLocation}</dd>
          <dt className="text-charcoal/60">{t("conf.status")}</dt>
          <dd>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              {t(`status.${order.status}`)}
            </span>
          </dd>
        </dl>

        <p className="mt-6 text-sm text-charcoal/70">
          {t("conf.willReach")} <strong>{order.phone}</strong> {t("conf.toConfirm")}
        </p>

        <div className="mt-6 rounded-card bg-sand/30 p-4">
          <p className="text-sm font-semibold text-charcoal">{t("conf.whatsNext")}</p>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-charcoal/80">
            <li>{t("conf.step1")}</li>
            <li>{t("conf.step2")}</li>
            <li>{t("conf.step3")}</li>
          </ol>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/track-order?order=${encodeURIComponent(order.orderNumber)}`}
            className="inline-block rounded-full bg-charcoal px-5 py-2.5 text-sm font-semibold text-ivory hover:bg-charcoal/80"
          >
            {t("conf.track")}
          </Link>
          <button
            type="button"
            onClick={downloadCalendar}
            className="inline-block rounded-full border border-charcoal/20 px-5 py-2.5 text-sm font-semibold text-charcoal hover:border-rose"
          >
            {t("conf.addCalendar")}
          </button>
          <WhatsAppButton
            message={`Hi! I just placed order #${order.orderNumber} on the website.`}
            label={t("conf.whatsapp")}
          />
        </div>
      </div>

      <Link href="/bouquets" className="mt-6 inline-block text-sm text-charcoal/60 hover:text-rose-dark">
        {t("conf.orderMore")}
      </Link>
    </div>
  );
}
