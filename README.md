# TIA Flower Shop

A mobile-first bouquet ordering platform for customers welcoming or seeing
off someone near Tribhuvan International Airport (TIA), Kathmandu, Nepal.

**Status:** Phase 1 MVP scaffold — runs locally on mock data, no database
required yet. See `docs/NEXT_STEPS.md` for the full roadmap.

## Tech stack

- [Next.js 14](https://nextjs.org/) (App Router) + React + TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- [MongoDB](https://www.mongodb.com/) + Mongoose (wired up, optional until Phase 2)
- Deploys to [Vercel](https://vercel.com/)

## Run it locally

You need [Node.js](https://nodejs.org/) 18+ installed.

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env.local
# then open .env.local and set your real WhatsApp number + admin key

# 3. Start the dev server
npm run dev
```

Open http://localhost:3000 in your browser. On your phone, use your
computer's local IP (e.g. `http://192.168.1.23:3000`) while both devices
are on the same Wi-Fi, to test the mobile-first design on a real screen.

## Project structure

```
app/
  page.tsx                 → homepage
  bouquets/page.tsx         → bouquet listing
  bouquets/[id]/page.tsx    → single product detail
  order/page.tsx            → order form
  order/confirmation/page.tsx → order confirmation
  contact/page.tsx          → contact page
  admin/login/page.tsx      → admin login (placeholder auth, see docs)
  admin/dashboard/page.tsx  → admin order dashboard
  api/products/route.ts     → GET products (mock data or MongoDB)
  api/orders/route.ts       → POST/GET orders (mock data or MongoDB)

components/                → shared UI (Navbar, Footer, BouquetCard, etc.)
lib/
  data.ts                   → mock product catalog (edit this to change bouquets)
  types.ts                  → shared TypeScript types
  mongodb.ts                → database connection helper (Phase 2)
models/                    → Mongoose schemas (Product, Order)
docs/NEXT_STEPS.md          → phase-by-phase roadmap
```

## Editing your bouquet catalog (before you have a database)

Open `lib/data.ts` and edit the `bouquets` array directly — name, price,
description, image path, `available`, `customizable`. This is your
product list until Phase 2 (MongoDB) is set up.

## Admin dashboard

Visit `/admin/login` and enter the value you set for `ADMIN_API_KEY` in
`.env.local`. This is a **placeholder**, not real authentication — see
`docs/NEXT_STEPS.md` Phase 3 before sharing dashboard access with anyone
else.

## Deploying to Vercel

1. Push this project to GitHub (see "Git & GitHub instructions" below).
2. Go to https://vercel.com, sign in with GitHub, and import the
   `tia-flower-shop` repository.
3. In the Vercel project settings, add the same environment variables
   from your `.env.local` (Vercel → Settings → Environment Variables).
4. Deploy. Vercel gives you a live URL (e.g.
   `tia-flower-shop.vercel.app`) — you can add a custom domain later.
5. Every time you push to the `main` branch, Vercel automatically
   redeploys.

## Git & GitHub instructions (review before pushing)

These files were generated for you to **review first**. When you're
happy with them:

```bash
# From inside the tia-flower-shop folder:
git init                     # only if this folder isn't already a git repo
git remote add origin https://github.com/sthaprashu001/tia-flower-shop.git
git add .
git commit -m "feat: Phase 1 MVP scaffold — homepage, bouquets, order flow, admin dashboard"
git branch -M main
git pull origin main --allow-unrelated-histories   # merge with existing README on GitHub
git push origin main
```

If `git pull` shows a merge conflict on `README.md` (since your GitHub
repo already has one commit with its own README), open the file, keep
the version you prefer (this new one has more detail), remove the
conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`), then:

```bash
git add README.md
git commit -m "merge: resolve README conflict"
git push origin main
```

**Never commit `.env.local`** — it's already in `.gitignore`, and it's
where your real WhatsApp number, admin key, and (later) database
credentials live.
