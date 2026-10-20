import { test } from "node:test";
import assert from "node:assert/strict";
import { DELETABLE, STATUS_FLOW, canTransition } from "../lib/orderStatus.ts";

const ALL = ["PENDING", "CONFIRMED", "PREPARING", "READY", "DELIVERED", "CANCELLED", "REJECTED"] as const;

test("happy path is allowed step by step", () => {
  assert.equal(canTransition("PENDING", "CONFIRMED"), true);
  assert.equal(canTransition("CONFIRMED", "PREPARING"), true);
  assert.equal(canTransition("PREPARING", "READY"), true);
  assert.equal(canTransition("READY", "DELIVERED"), true);
});

test("nonsense jumps are blocked", () => {
  assert.equal(canTransition("DELIVERED", "PENDING"), false);
  assert.equal(canTransition("PENDING", "DELIVERED"), false);
  assert.equal(canTransition("DELIVERED", "CANCELLED"), false);
  assert.equal(canTransition("CANCELLED", "DELIVERED"), false);
});

test("every status is defined and never points at itself", () => {
  for (const s of ALL) {
    assert.ok(STATUS_FLOW[s], s);
    assert.equal(STATUS_FLOW[s].includes(s), false, s);
  }
});

test("only dead orders can be deleted", () => {
  assert.deepEqual([...DELETABLE].sort(), ["CANCELLED", "REJECTED"]);
});
