# TIA Flower Shop

A mobile-first bouquet ordering platform for customers welcoming or seeing
off someone near Tribhuvan International Airport (TIA), Kathmandu, Nepal.

**Status:** Live at **https://tiaflowershop.online** — MongoDB + Vercel deployment, admin dashboard, featured products.
See `docs/NEXT_STEPS.md` for the roadmap.

## Tech stack

- [Next.js 14](https://nextjs.org/) (App Router) + React + TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- [MongoDB](https://www.mongodb.com/) + Mongoose (wired up, optional until Phase 2)
- Deploys to [Vercel](https://vercel.com/)



## Project structure

```
Run the unit tests with `npm test` (Node 22+, no extra packages).

app/
  page.tsx                 → homepage
  bouquets/page.tsx         → bouquet listing
  bouquets/[id]/page.tsx    → single product detail
  order/page.tsx            → order form
  order/confirmation/page.tsx → order confirmation
  contact/page.tsx          → contact page
  track-order/page.tsx      → customer order tracking (order number + phone)
  admin/login/page.tsx      → admin login (NextAuth, see docs)
  admin/dashboard/page.tsx  → admin order dashboard
  api/products/route.ts     → GET products (mock data or MongoDB)
  api/orders/route.ts       → POST orders (public), GET active orders (admin)
  api/orders/track/route.ts → public tracking by order number + phone

components/                → shared UI (Navbar, Footer, BouquetCard, etc.)
lib/
  data.ts                   → mock product catalog (edit this to change bouquets)
  types.ts                  → shared TypeScript types
  orderStatus.ts            → allowed order status changes (shared by API + admin UI)
  rateLimit.ts              → rate limiter (Upstash Redis, memory fallback)
  mongodb.ts                → database connection helper (Phase 2)
models/                    → Mongoose schemas (Product, Order)
docs/NEXT_STEPS.md          → phase-by-phase roadmap
```
