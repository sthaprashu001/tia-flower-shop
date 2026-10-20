import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanText, isEmail, isIsoDate, isObjectId, isPhone, isSafeImageUrl, isTime, normalizePhone, parseProductFields } from "../lib/validation.ts";

test("normalizePhone makes equivalent Nepali numbers identical", () => {
  const forms = ["9841234567", "98-4123 4567", "+977 9841234567", "977-9841234567", "00977 9841234567", " 9841234567 "];
  for (const f of forms) assert.equal(normalizePhone(f), "9841234567", f);
});

test("normalizePhone keeps foreign numbers with their country code", () => {
  assert.equal(normalizePhone("+44 7700 900123"), "+447700900123");
  assert.equal(normalizePhone("0044 7700 900123"), "+447700900123");
});

test("isPhone accepts realistic numbers and rejects junk", () => {
  assert.equal(isPhone("9841234567"), true);
  assert.equal(isPhone("+977 984-123-4567"), true);
  assert.equal(isPhone("abc"), false);
  assert.equal(isPhone("12"), false);
  assert.equal(isPhone(123456789), false);
});

test("isIsoDate rejects impossible dates", () => {
  assert.equal(isIsoDate("2026-09-20"), true);
  assert.equal(isIsoDate("2026-02-30"), false);
  assert.equal(isIsoDate("20-09-2026"), false);
});

test("isTime", () => {
  assert.equal(isTime("00:00"), true);
  assert.equal(isTime("23:59"), true);
  assert.equal(isTime("24:00"), false);
  assert.equal(isTime("9:30"), false);
});

test("cleanText trims, strips control characters and caps length", () => {
  assert.equal(cleanText("  hi\u0000 there  ", 100), "hi there");
  assert.equal(cleanText("abcdef", 3), "abc");
  assert.equal(cleanText(42, 10), "");
});

test("isObjectId / isEmail", () => {
  assert.equal(isObjectId("507f1f77bcf86cd799439011"), true);
  assert.equal(isObjectId("nope"), false);
  assert.equal(isEmail("a@b.co"), true);
  assert.equal(isEmail("a@b"), false);
});

test("isSafeImageUrl only allows local images and Vercel Blob", () => {
  assert.equal(isSafeImageUrl("/images/red-rose.svg"), true);
  assert.equal(isSafeImageUrl("/images/../secret"), false);
  assert.equal(isSafeImageUrl("https://abc.public.blob.vercel-storage.com/x.png"), true);
  assert.equal(isSafeImageUrl("https://evil.example.com/x.png"), false);
  assert.equal(isSafeImageUrl("javascript:alert(1)"), false);
});

test("parseProductFields validates and whitelists", () => {
  const ok = parseProductFields({ name: "Rose", price: 500, evil: "x" }, false);
  assert.deepEqual(ok, { data: { name: "Rose", price: 500 } });
  assert.ok("error" in parseProductFields({ name: "", price: 500 }, false));
  assert.ok("error" in parseProductFields({ name: "Rose", price: -1 }, false));
});
