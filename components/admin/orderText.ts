import { Order } from "@/lib/types";
import { formatPickup } from "@/lib/time";

/** Item name: the snapshot saved with the order, else the live catalog name, else the id. */
export function itemName(item: Order["items"][number], lookup: Record<string, string>): string {
  return item.name || lookup[item.bouquetId] || item.bouquetId;
}

/** Plain-text order summary used for "Share" (WhatsApp / system share sheet). */
export function orderSummaryText(order: Order, lookup: Record<string, string>): string {
  const lines = [
    `Order ${order.orderNumber}${order.urgent ? " (URGENT)" : ""}`,
    `Customer: ${order.customerName}`,
    `Phone: ${order.phone}`,
    `Pickup: ${formatPickup(order.date, order.time)}`,
    `Meeting point: ${order.meetingLocation}`,
    "Items:",
    ...order.items.map((i) => `- ${itemName(i, lookup)} x${i.quantity}`),
  ];
  if (order.customizationNote) lines.push(`Requests: ${order.customizationNote}`);
  lines.push(`Total: Rs. ${order.total.toLocaleString("en-IN")}`);
  return lines.join("\n");
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** A clean one-page card for printing (all customer text is HTML-escaped). */
export function orderCardHtml(order: Order, lookup: Record<string, string>): string {
  const rows = order.items
    .map((i) => `<tr><td>${esc(itemName(i, lookup))}</td><td class="q">× ${i.quantity}</td></tr>`)
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Order ${esc(order.orderNumber)}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;margin:24px;color:#262321}
  h1{margin:0 0 4px;font-size:26px} .sub{color:#666;margin:0 0 16px}
  .urgent{color:#c22348;font-weight:bold;margin:0 0 12px}
  table{width:100%;border-collapse:collapse;margin:12px 0} td{padding:6px 0;border-bottom:1px solid #ddd}
  td.q{text-align:right;width:70px} dt{color:#666;font-size:12px;margin-top:10px} dd{margin:2px 0 0;font-size:16px}
  .total{font-size:20px;font-weight:bold;margin-top:14px}
  .note{background:#f5f2ee;padding:8px 10px;margin-top:10px;border-radius:6px;white-space:pre-wrap}
</style></head><body>
<h1>${esc(order.orderNumber)}</h1><p class="sub">TIA Flower Shop</p>
${order.urgent ? '<p class="urgent">URGENT ORDER</p>' : ""}
<dl>
<dt>Customer</dt><dd>${esc(order.customerName)}</dd>
<dt>Phone</dt><dd>${esc(order.phone)}</dd>
<dt>Pickup</dt><dd>${esc(formatPickup(order.date, order.time))}</dd>
<dt>Meeting point</dt><dd>${esc(order.meetingLocation)}</dd>
</dl>
<table>${rows}</table>
${order.customizationNote ? `<div class="note"><strong>Requests:</strong> ${esc(order.customizationNote)}</div>` : ""}
<p class="total">Total: Rs. ${order.total.toLocaleString("en-IN")}</p>
</body></html>`;
}
