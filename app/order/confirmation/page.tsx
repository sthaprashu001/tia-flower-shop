"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Order } from "@/lib/types";
import { getBouquetById } from "@/lib/data";

export default function ConfirmationPage() {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("lastOrder");
    if (raw) setOrder(JSON.parse(raw));
  }, []);

  if (!order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="font-display text-2xl italic text-charcoal">No recent order found</h1>
        <p className="mt-2 text-charcoal/70">
          If you just placed an order, try going back. Otherwise, start a new one below.
        </p>
        <Link
          href="/order"
          className="mt-6 inline-block rounded-full bg-rose px-6 py-3 text-sm font-semibold text-ivory hover:bg-rose-dark"
        >
          Place an order
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-card border border-sand bg-white p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-sage-dark">
          Order received
        </p>
        <h1 className="mt-1 font-display text-3xl italic text-charcoal">
          #{order.orderNumber}
        </h1>

        <div className="mt-6 space-y-1">
          {order.items.map((item) => {
            const b = getBouquetById(item.bouquetId);
            return (
              <div key={item.bouquetId} className="flex justify-between text-sm">
                <span>{b?.name || item.bouquetId} × {item.quantity}</span>
                <span className="font-mono">
                  Rs. {((b?.price || 0) * item.quantity).toLocaleString("en-IN")}
                </span>
              </div>
            );
          })}
          <div className="mt-2 flex justify-between border-t border-sand pt-2 font-semibold">
            <span>Total</span>
            <span className="font-mono text-rose-dark">
              Rs. {order.total.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-charcoal/60">Date</dt>
          <dd>{order.date}</dd>
          <dt className="text-charcoal/60">Time</dt>
          <dd>{order.time}</dd>
          <dt className="text-charcoal/60">Meeting point</dt>
          <dd>{order.meetingLocation}</dd>
          <dt className="text-charcoal/60">Status</dt>
          <dd>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              {order.status}
            </span>
          </dd>
        </dl>

        <p className="mt-6 text-sm text-charcoal/70">
          We'll reach out to you on WhatsApp at <strong>{order.phone}</strong>{" "}
          to confirm the details and meeting point.
        </p>

        <div className="mt-6">
          <WhatsAppButton
            message={`Hi! I just placed order #${order.orderNumber} on the website.`}
            label="Message us about this order"
          />
        </div>
      </div>

      <Link href="/bouquets" className="mt-6 inline-block text-sm text-charcoal/60 hover:text-rose-dark">
        ← Order something else
      </Link>
    </div>
  );
}
