"use client";

import { useState } from "react";
import { Order, OrderStatus } from "@/lib/types";
import { formatPickup } from "@/lib/time";
import { itemName, orderCardHtml, orderSummaryText } from "./orderText";

const STATUS_OPTIONS: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY", "DELIVERED", "CANCELLED", "REJECTED"];

// The one obvious next step for each stage — a single tap on a phone.
const NEXT_STEP: Partial<Record<OrderStatus, { to: OrderStatus; label: string; style: string }>> = {
  PENDING: { to: "CONFIRMED", label: "✓ Accept order", style: "bg-sage text-ivory hover:bg-sage-dark" },
  CONFIRMED: { to: "PREPARING", label: "Start preparing", style: "bg-charcoal text-ivory hover:bg-charcoal/80" },
  PREPARING: { to: "READY", label: "Mark ready", style: "bg-charcoal text-ivory hover:bg-charcoal/80" },
  READY: { to: "DELIVERED", label: "✓ Mark delivered", style: "bg-sage text-ivory hover:bg-sage-dark" },
};

const STATUS_BADGE: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PREPARING: "bg-blue-100 text-blue-800",
  READY: "bg-green-100 text-green-800",
  DELIVERED: "bg-sage-light text-sage-dark",
  CANCELLED: "bg-charcoal/10 text-charcoal/70",
  REJECTED: "bg-charcoal/10 text-charcoal/70",
};

export default function AdminOrderCard({
  order,
  nameLookup,
  saving,
  error,
  onStatusChange,
  onDelete,
}: {
  order: Order;
  nameLookup: Record<string, string>;
  saving?: boolean;
  error?: string;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onDelete?: (orderId: string) => void;
}) {
  const [shareNote, setShareNote] = useState<string | null>(null);
  const next = NEXT_STEP[order.status];
  const canReject = order.status === "PENDING";
  const canCancel = ["CONFIRMED", "PREPARING", "READY"].includes(order.status);

  function printCard() {
    const w = window.open("", "_blank", "width=480,height=720");
    if (!w) {
      setShareNote("Allow pop-ups to print.");
      return;
    }
    w.document.write(orderCardHtml(order, nameLookup));
    w.document.close();
    w.focus();
    w.print();
  }

  async function share() {
    const text = orderSummaryText(order, nameLookup);
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: `Order ${order.orderNumber}`, text });
        return;
      }
    } catch {
      return; // share sheet dismissed
    }
    // No share sheet (desktop browsers): open WhatsApp with the text ready to send.
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(orderSummaryText(order, nameLookup));
      setShareNote("Copied ✓");
      setTimeout(() => setShareNote(null), 2000);
    } catch {
      setShareNote("Could not copy.");
    }
  }

  const tint =
    order.status === "PENDING"
      ? "border-yellow-300 bg-yellow-50"
      : order.status === "READY"
      ? "border-green-300 bg-green-50"
      : "border-sand bg-white";

  return (
    <div className={`rounded-card border p-4 ${tint}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-charcoal">
            #{order.orderNumber} — {order.customerName}
            {order.urgent && <span className="ml-2 text-xs font-bold text-red-600">🚨 URGENT</span>}
          </p>
          <p className="text-sm text-charcoal/70">
            📱 <a href={`tel:${order.phone}`} className="underline">{order.phone}</a> · 📍 {order.meetingLocation}
          </p>
          <p className="text-sm text-charcoal/70">📅 {formatPickup(order.date, order.time)}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[order.status]}`}>
          {order.status}
        </span>
      </div>

      <ul className="mt-2 text-sm text-charcoal/80">
        {order.items.map((item) => (
          <li key={item.bouquetId}>
            {itemName(item, nameLookup)} × {item.quantity}
          </li>
        ))}
      </ul>

      {order.customizationNote && (
        <p className="mt-1 text-sm italic text-charcoal/60">📝 {order.customizationNote}</p>
      )}

      <p className="mt-2 font-mono text-sm font-bold text-rose-dark">Rs. {order.total.toLocaleString("en-IN")}</p>

      {/* One-tap actions */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {next && (
          <button
            onClick={() => onStatusChange(order.id, next.to)}
            disabled={saving}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition disabled:opacity-60 ${next.style}`}
          >
            {next.label}
          </button>
        )}
        {canReject && (
          <button
            onClick={() => onStatusChange(order.id, "REJECTED")}
            disabled={saving}
            className="rounded-full border border-sand px-4 py-2 text-sm font-semibold text-charcoal hover:border-rose-dark hover:text-rose-dark disabled:opacity-60"
          >
            Reject
          </button>
        )}
        {canCancel && (
          <button
            onClick={() => {
              if (confirm("Cancel this order?")) onStatusChange(order.id, "CANCELLED");
            }}
            disabled={saving}
            className="rounded-full border border-sand px-4 py-2 text-sm font-semibold text-charcoal hover:border-rose-dark hover:text-rose-dark disabled:opacity-60"
          >
            Cancel
          </button>
        )}
        {saving && <span className="text-xs text-charcoal/40">Saving…</span>}
      </div>
      {error && <p className="mt-1 text-xs text-rose-dark">{error}</p>}

      {/* Print / share / other */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-charcoal/10 pt-3 text-sm">
        <button onClick={printCard} className="text-charcoal/70 hover:text-rose-dark hover:underline">
          🖨 Print card
        </button>
        <button onClick={share} className="text-charcoal/70 hover:text-rose-dark hover:underline">
          📤 Share
        </button>
        <button onClick={copy} className="text-charcoal/70 hover:text-rose-dark hover:underline">
          📋 Copy
        </button>
        {shareNote && <span className="text-xs text-charcoal/50">{shareNote}</span>}

        <label className="ml-auto flex items-center gap-1 text-xs text-charcoal/50">
          Other status
          <select
            value={order.status}
            onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
            disabled={saving}
            className="rounded-md border border-sand bg-white px-2 py-1 text-xs text-charcoal disabled:opacity-60"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        {onDelete && (
          <button onClick={() => onDelete(order.id)} className="text-xs text-charcoal/40 hover:text-rose-dark hover:underline">
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
