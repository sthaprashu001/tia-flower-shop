import { Bouquet, ShopStatus } from "./types";

/**
 * PHASE 1 (this scaffold): bouquets live here as mock data so the site
 * can be designed and tested without a database.
 *
 * PHASE 2: replace this file's exports with real calls to MongoDB
 * (see /models/Product.ts once it exists, and docs/NEXT_STEPS.md).
 *
 * Images below are placeholder SVGs (public/images/*.svg) — swap in real
 * bouquet photos (jpg/png/webp) with the same filenames, or update the
 * `image` paths, once you have product photography.
 */
export const bouquets: Bouquet[] = [
  {
    id: "red-rose-classic",
    name: "Red Rose Bouquet black cover",
    price: 1200,
    description:
      "A dozen fresh red roses, hand-tied with kraft wrapping and a satin ribbon. Our most popular welcome-home pick.",
    image: "/images/red-rose-black-cover.jpeg",
    available: true,
    customizable: true,
  },
  {
    id: "red-rose-classic-2",
    name: "Red Rose Bouquet",
    price: 1200,
    description:
      "A dozen fresh red roses, hand-tied with kraft wrapping and a satin ribbon. Our most popular welcome-home pick.",
    image: "/images/red-rose.svg",
    available: true,
    customizable: true,
  },
  {
    id: "mixed-flower",
    name: "Mixed Flower Bouquet",
    price: 950,
    description:
      "A cheerful seasonal mix of locally sourced flowers, arranged fresh the morning of your pickup.",
    image: "/images/mixed-flower.svg",
    available: true,
    customizable: true,
  },
  {
    id: "ribbon-rose",
    name: "Ribbon Rose Bouquet",
    price: 700,
    description:
      "Elegant rose-fold ribbon bouquet that lasts far longer than fresh flowers — a favorite for long departures.",
    image: "/images/ribbon-rose.svg",
    available: true,
    customizable: false,
  },
  {
    id: "small-real",
    name: "Small Real Flower Bunch",
    price: 400,
    description:
      "A compact, budget-friendly bunch of fresh flowers — perfect for a quick welcome at the gate.",
    image: "/images/small-bunch.svg",
    available: false,
    customizable: false,
  },
  {
    id: "custom",
    name: "Custom Bouquet",
    price: 1500,
    description:
      "Tell us what you have in mind — flower type, colors, wrapping, ribbon — and we'll prepare it for you.",
    image: "/images/custom.svg",
    available: true,
    customizable: true,
  },
];

export function getBouquetById(id: string): Bouquet | undefined {
  return bouquets.find((b) => b.id === id);
}

/**
 * Admin will control this from the dashboard in Phase 3.
 * For now, change the value below (or set NEXT_PUBLIC_SHOP_STATUS in .env.local).
 */
export const shopStatus: ShopStatus =
  (process.env.NEXT_PUBLIC_SHOP_STATUS as ShopStatus) || "OPEN";

export const shopStatusCopy: Record<ShopStatus, string> = {
  OPEN: "Accepting orders normally",
  BUSY: "High demand — please allow extra time",
  CLOSED: "Not accepting new orders right now",
};
