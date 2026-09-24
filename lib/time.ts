/**
 * Shop-local time helpers, shared by the browser and the server.
 *
 * The shop is in Kathmandu (Nepal Standard Time, UTC+5:45, no daylight
 * saving). Every "pickup date + time" a customer picks is in THAT time
 * zone, whatever the visitor's own device clock says — so both the order
 * form and the server convert with the same fixed offset.
 */
export const SHOP_UTC_OFFSET_MINUTES = 5 * 60 + 45;
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** Pickup moment as a UTC timestamp (ms). `date` = YYYY-MM-DD, `time` = HH:MM shop time. */
export function pickupInstantMs(date: string, time: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return Date.UTC(y, m - 1, d, hh, mm) - SHOP_UTC_OFFSET_MINUTES * MIN;
}

/** Today's date (YYYY-MM-DD) in shop time. */
export function shopToday(nowMs: number = Date.now()): string {
  return new Date(nowMs + SHOP_UTC_OFFSET_MINUTES * MIN).toISOString().slice(0, 10);
}

/** Date `n` days after an ISO date (YYYY-MM-DD). */
export function addDaysIso(date: string, n: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
}

/** "12 hours", "1 day", "2 days", "36 hours" … for showing a lead time. */
export function leadTimeLabel(hours: number): string {
  if (hours <= 0) return "";
  if (hours % 24 === 0) {
    const d = hours / 24;
    return d === 1 ? "1 day" : `${d} days`;
  }
  return hours === 1 ? "1 hour" : `${hours} hours`;
}

/** Presets shown in the admin form; anything else is a custom number of hours. */
export const LEAD_TIME_PRESETS: { hours: number; label: string }[] = [
  { hours: 0, label: "No minimum notice" },
  { hours: 12, label: "12 hours before" },
  { hours: 24, label: "1 day before" },
  { hours: 48, label: "2 days before" },
];

/** Earliest allowed pickup (ms) for an order placed at `nowMs` needing `leadHours` notice. */
export function earliestPickupMs(nowMs: number, leadHours: number): number {
  return nowMs + Math.max(0, leadHours) * HOUR;
}

/** Longest lead time among the ordered products (0 when none). */
export function maxLeadHours(items: { leadTimeHours?: number }[]): number {
  return items.reduce((max, i) => Math.max(max, i.leadTimeHours || 0), 0);
}

/** "HH:MM" pickup slots every `stepMin` minutes while the shop is open. */
export function buildSlots(openHour: number, closeHour: number, stepMin = 30): string[] {
  const slots: string[] = [];
  for (let m = openHour * 60; m + stepMin <= closeHour * 60; m += stepMin) {
    slots.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  }
  return slots;
}

/** Friendly "Fri, 25 Sep · 14:30" for a shop-time date + time. */
export function formatPickup(date: string, time: string, locale = "en-GB"): string {
  const d = new Date(`${date}T00:00:00Z`);
  const day = d.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  return `${day} · ${time}`;
}
