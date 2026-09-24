import { isDatabaseConfigured, connectToDatabase } from "@/lib/mongodb";
import { buildSlots, earliestPickupMs, pickupInstantMs } from "@/lib/time";
import Order from "@/models/Order";
import { Order as OrderType } from "@/lib/types";

declare global {
  // eslint-disable-next-line no-var
  var _mockOrders: OrderType[] | undefined;
}

// Orders that still take up a slot (cancelled / rejected ones free it).
const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "PREPARING", "READY", "DELIVERED"];

/**
 * How many active orders are booked in each pickup hour of `date`,
 * e.g. { "09": 2, "14": 8 }. "8 orders per hour" means per requested
 * pickup hour, not per hour the order was placed.
 */
export async function getHourCounts(date: string): Promise<Record<string, number>> {
  let times: string[];
  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const rows = await Order.find({ date, status: { $in: ACTIVE_STATUSES } })
      .select("time")
      .lean<{ time: string }[]>();
    times = rows.map((r) => r.time);
  } else {
    times = (global._mockOrders || [])
      .filter((o) => o.date === date && ACTIVE_STATUSES.includes(o.status))
      .map((o) => o.time);
  }
  const counts: Record<string, number> = {};
  for (const t of times) {
    const hour = t.slice(0, 2);
    counts[hour] = (counts[hour] || 0) + 1;
  }
  return counts;
}

/**
 * Up to `limit` nearby free pickup slots on `date` — offered when the
 * customer's chosen slot is fully booked.
 */
export function suggestSlots(opts: {
  date: string;
  requestedTime: string;
  counts: Record<string, number>;
  capacityPerHour: number;
  openHour: number;
  closeHour: number;
  leadHours: number;
  nowMs?: number;
  limit?: number;
}): string[] {
  const { date, requestedTime, counts, capacityPerHour, openHour, closeHour, leadHours } = opts;
  const nowMs = opts.nowMs ?? Date.now();
  const earliest = earliestPickupMs(nowMs, leadHours);
  const requestedMin = Number(requestedTime.slice(0, 2)) * 60 + Number(requestedTime.slice(3, 5));

  const free = buildSlots(openHour, closeHour).filter(
    (t) => pickupInstantMs(date, t) >= earliest && (counts[t.slice(0, 2)] || 0) < capacityPerHour
  );
  const distance = (t: string) => Math.abs(Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)) - requestedMin);
  return free
    .sort((a, b) => distance(a) - distance(b))
    .slice(0, opts.limit ?? 3)
    .sort();
}
