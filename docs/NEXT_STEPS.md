# Next Steps — TIA Flower Shop

This scaffold is a working **Phase 1 MVP** you can run locally today. It is
intentionally not "finished" — read this file to see what's real, what's a
placeholder, and what to build next, in order.

## What's already working

- Mobile-first homepage, bouquet listing, product detail pages
- Order form → `/api/orders` → confirmation page
- Order total calculated **server-side** (never trusted from the browser)
- A lightweight admin dashboard that lists orders
- Shop status badge (OPEN/BUSY/CLOSED), read from an env variable
- WhatsApp button wired to a real `wa.me` link
- Data currently lives in `lib/data.ts` (mock) and an in-memory array for
  orders (`app/api/orders/route.ts`) — resets when the dev server restarts

## Phase 1 — Finish the MVP on mock data (do this first)

You do **not** need a database yet. Focus here:

1. Replace placeholder SVGs in `public/images/` with real bouquet photos.
2. Edit `lib/data.ts` — this is your product catalog for now. Add/remove/
   edit bouquets directly in this file.
3. Set your real WhatsApp number and admin key in `.env.local` (copy from
   `.env.example`).
4. Test the full customer flow: homepage → bouquets → product detail →
   order form → confirmation.
5. Test the admin flow: `/admin/login` → dashboard → see the order you
   just placed.
6. Deploy to Vercel (see README) so you can test on your real phone and
   share the link with a few real customers or friends.

## Phase 2 — Add a real database (MongoDB)

Once mock data feels limiting (you want orders to survive a restart, or
multiple people need to see the same product list):

1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Add the connection string to `.env.local` as `MONGODB_URI`
3. `models/Product.ts` and `models/Order.ts` already exist — the API
   routes in `app/api/products/route.ts` and `app/api/orders/route.ts`
   already switch to the database automatically once `MONGODB_URI` is set
4. Write a small script to seed your `lib/data.ts` bouquets into the
   `products` collection (or add them once by hand via MongoDB Atlas's
   web UI / Compass)
5. Once products come from the database, build the admin "add/edit
   product" screens (a form + `PATCH`/`POST` to `/api/products`)

## Phase 3 — Real admin authentication

Right now, `/admin/login` checks a single shared key
(`ADMIN_API_KEY`) against `/api/orders?key=...`. That's fine for you
testing alone, but **not safe** once your sister or other staff have the
link, because:

- Everyone shares one password (no individual accounts)
- The key is stored in plain `sessionStorage`
- There's no real session/cookie, no expiry

Before handing this out to multiple people:

1. Add [NextAuth.js](https://authjs.dev/) (or a simpler custom
   email+password login backed by a `User` model with hashed passwords)
2. Protect all `/admin/*` routes and all `/api/orders`, `/api/products`
   write operations with a real session check
3. Give each authorized person (you, your sister, workers) their own
   login

## Phase 4 — Order status updates, capacity, and business controls

- Add a `PATCH /api/orders/[id]` route so the dashboard's status dropdown
  actually saves (right now it's display-only)
- Wire the OPEN/BUSY/CLOSED toggle to the database instead of an env
  variable, and let admin change it from the dashboard
- Add basic capacity logic: count confirmed orders per hour, warn admin
  (or block new orders) past ~8/hour
- Add the urgent-order form (`urgent: true` on `OrderInput` already
  exists — build a `/order/urgent` page that reuses most of `/order`)

## Phase 5 — Sales & profit view (admin-only)

- Add a `cost` field per product (already on the `Product` model)
- Sum `DELIVERED` orders by day/week for a simple revenue view
- Never expose cost or profit numbers on any customer-facing page

## Phase 6 — Payment, Nepali translation, polish

- eSewa/Khalti integration (optional — most Nepali flower/food businesses
  launch without this and add it later)
- Nepali translation — the site copy is centralized enough (component
  text, not scattered strings) that adding `next-intl` later is
  straightforward
- Real product photography, refined copy, analytics (Vercel Analytics or
  Plausible)

## A note on scope

Re-read `requirements-summary-via-chatgpt.txt` section 35
("Important Features NOT Needed Initially") before adding anything not
listed above. Flight tracking, payment gateways, customer accounts,
loyalty systems, etc. are explicitly deferred — resist the urge to build
them early.
