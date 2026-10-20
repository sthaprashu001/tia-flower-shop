import { test } from "node:test";
import assert from "node:assert/strict";
import { addDaysIso, buildSlots, earliestPickupMs, leadTimeLabel, pickupInstantMs, shopToday } from "../lib/time.ts";

test("pickupInstantMs converts Kathmandu time (UTC+5:45) to UTC", () => {
  // 2026-09-20 14:30 in Kathmandu is 08:45 UTC
  assert.equal(new Date(pickupInstantMs("2026-09-20", "14:30")).toISOString(), "2026-09-20T08:45:00.000Z");
  // early morning in Nepal is the previous day in UTC
  assert.equal(new Date(pickupInstantMs("2026-09-20", "04:00")).toISOString(), "2026-09-19T22:15:00.000Z");
});

test("shopToday uses shop time, not UTC", () => {
  // 20:00 UTC on the 19th is already 01:45 on the 20th in Kathmandu
  assert.equal(shopToday(Date.UTC(2026, 8, 19, 20, 0)), "2026-09-20");
  assert.equal(shopToday(Date.UTC(2026, 8, 19, 10, 0)), "2026-09-19");
});

test("addDaysIso handles month and year ends", () => {
  assert.equal(addDaysIso("2026-12-31", 1), "2027-01-01");
  assert.equal(addDaysIso("2026-02-27", 2), "2026-03-01");
});

test("buildSlots gives half-hour slots inside opening hours only", () => {
  const slots = buildSlots(6, 8);
  assert.deepEqual(slots, ["06:00", "06:30", "07:00", "07:30"]);
});

test("earliestPickupMs adds the lead time and never goes backwards", () => {
  assert.equal(earliestPickupMs(1000, 1), 1000 + 60_000);
  assert.equal(earliestPickupMs(1000, -5), 1000);
});

test("leadTimeLabel", () => {
  assert.equal(leadTimeLabel(0), "");
  assert.equal(leadTimeLabel(90), "1 hour 30 minutes");
  assert.equal(leadTimeLabel(1440), "1 day");
});
