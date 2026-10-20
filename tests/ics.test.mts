import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPickupIcs } from "../lib/ics.ts";
import { pickupInstantMs } from "../lib/time.ts";

test("calendar file has the pickup in UTC, an alarm, and escaped text", () => {
  const ics = buildPickupIcs({
    orderNumber: "TIA12345678",
    startMs: pickupInstantMs("2026-09-20", "14:30"),
    meetingLocation: "Arrivals exit, gate 2; left side",
    items: ["Red rose x 2"],
    nowMs: Date.UTC(2026, 8, 1, 0, 0, 0),
  });
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /DTSTART:20260920T084500Z\r\n/); // 14:30 Kathmandu = 08:45 UTC
  assert.match(ics, /DTEND:20260920T091500Z\r\n/);
  assert.match(ics, /LOCATION:Arrivals exit\\, gate 2\\; left side\r\n/);
  assert.match(ics, /TRIGGER:-PT60M/);
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
});
