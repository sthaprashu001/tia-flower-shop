/** Escape text for an iCalendar field (RFC 5545). */
function esc(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function stamp(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * A one-event .ics file for a pickup, so the customer can drop it in their
 * phone calendar (with a reminder 60 minutes before).
 */
export function buildPickupIcs(opts: {
  orderNumber: string;
  startMs: number; // pickup moment as a UTC timestamp (see pickupInstantMs in lib/time.ts)
  meetingLocation: string;
  items: string[];
  durationMinutes?: number;
  nowMs?: number;
}): string {
  const start = opts.startMs;
  const end = start + (opts.durationMinutes ?? 30) * 60_000;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TIA Flower Shop//Order//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${opts.orderNumber}@tiaflowershop`,
    `DTSTAMP:${stamp(opts.nowMs ?? Date.now())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(`Flower pickup #${opts.orderNumber}`)}`,
    `LOCATION:${esc(opts.meetingLocation)}`,
    `DESCRIPTION:${esc(`TIA Flower Shop order ${opts.orderNumber}\n${opts.items.join("\n")}`)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT60M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Flower pickup in 1 hour",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}
