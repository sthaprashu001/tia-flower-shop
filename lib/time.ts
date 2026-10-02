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

/** "45 minutes", "12 hours", "1 day", "1 day 6 hours" … for showing a lead time. */
export function leadTimeLabel(minutes: number): string {
  if (minutes <= 0) return "";
  const d = Math.floor(minutes / (24 * 60));
  const h = Math.floor((minutes % (24 * 60)) / 60);
  const m = minutes % 60;
  const parts: string[] = [];
  if (d) parts.push(d === 1 ? "1 day" : `${d} days`);
  if (h) parts.push(h === 1 ? "1 hour" : `${h} hours`);
  if (m) parts.push(m === 1 ? "1 minute" : `${m} minutes`);
  return parts.join(" ");
}

/** Presets shown in the admin form, in minutes; anything else is a custom amount. */
export const LEAD_TIME_PRESETS: { minutes: number; label: string }[] = [
  { minutes: 0, label: "No minimum notice" },
  { minutes: 15, label: "15 minutes before" },
  { minutes: 30, label: "30 minutes before" },
  { minutes: 60, label: "1 hour before" },
  { minutes: 180, label: "3 hours before" },
  { minutes: 720, label: "12 hours before" },
  { minutes: 1440, label: "1 day before" },
  { minutes: 2880, label: "2 days before" },
];

/** Earliest allowed pickup (ms) for an order placed at `nowMs` needing `leadMinutes` notice. */
export function earliestPickupMs(nowMs: number, leadMinutes: number): number {
  return nowMs + Math.max(0, leadMinutes) * MIN;
}

/** Longest lead time (in minutes) among the ordered products (0 when none). */
export function maxLeadMinutes(items: { leadTimeMinutes?: number }[]): number {
  return items.reduce((max, i) => Math.max(max, i.leadTimeMinutes || 0), 0);
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
