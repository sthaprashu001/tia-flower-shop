# Changes in this update

## Security & reliability

| Area | Before | Now |
| --- | --- | --- |
| Order lookup by phone | `GET /api/orders?phone=` returned every order for a phone number | **Removed.** Tracking needs order number **and** phone (`/api/orders/track`), returns first name only, never the phone, `no-store` |
| Order numbers | `TIA` + 6 digits | `TIA` + 8 digits (old numbers still track) |
| Tracking brute force | 10/10 min per IP | 40/10 min per IP **plus** 30/10 min per order number |
| Rate limiter | In-memory per serverless instance | **Upstash Redis** when `UPSTASH_REDIS_REST_URL/TOKEN` are set (shared by all instances); memory fallback if unset or Redis is down |
| Client IP | first `x-forwarded-for` | `x-vercel-forwarded-for` / `x-real-ip` first |
| Overbooking | check-then-insert race | After saving, the hour is re-checked; the earlier orders keep the slot, the later one is released with alternative times |
| Status changes | any status to any status | Rules in `lib/orderStatus.ts` (API + admin dropdown). Mis-tap undo is allowed; reopening a cancelled order re-checks slot capacity; updates are compare-and-set |
| Deleting orders | any order, permanently | Only **cancelled / rejected** orders; delivered orders are kept for sales history |
| WhatsApp alerts | sent to admins one by one | Sent in parallel with a 5 s timeout |
| Phone numbers | stored as typed (tracking failed on `98-41…` vs `9841…`) | Normalised (`+977`, spaces and dashes ignored) on save and on lookup |
| Duplicated mock globals | declared in 3 files | `lib/mockStore.ts` |

`/order-status` now redirects to `/track-order`.

## Checkout & tracking UX

- **Today / Tomorrow chips** and the earliest date pre-selected, so times show immediately.
- **"Earliest available" button** in the time picker: one tap to the soonest free slot.
- **Quick-pick meeting points** (arrivals exit, departures, golden gate, parking, bus stop).
- **− / + quantity stepper** in cart and order form.
- **Inline phone validation** and error messages that scroll into view.
- **Pickup summary** above the total; **sticky "Place order · Rs. X" bar** on phones.
- **Confirmation page:** "what happens next", **Add to calendar** (.ics with a 1-hour reminder), one-tap tracking.
- **Tracking page** (English + Nepali): remembers recent orders on the device, loads the latest automatically, progress stepper, **auto-refresh every 45 s**, friendly status messages, item names and prices (the old page showed raw bouquet IDs), WhatsApp help.

## Tests

`npm test` runs 20 unit tests (time zone maths, validation, phone normalisation, status rules, calendar file).

## Notes for deployment

1. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel (optional but recommended).
2. No database migration needed. Existing orders keep working.
3. This update could not be built with `next build` in the environment it was made in (no network, so no `npm install`). Run `npm install && npm run build && npm test` before deploying and test one order end to end.
