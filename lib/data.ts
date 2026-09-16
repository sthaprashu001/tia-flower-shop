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
    category: "Bouquets",
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
    category: "Bouquets",
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
    category: "Bouquets",
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
    category: "Bouquets",
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
    category: "Bouquets",
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
    category: "Bouquets",
  },
];

// Mock Khata products
export const khataProducts: Bouquet[] = [
  {
    id: "khata-multicolor",
    name: "Multicolor Khata",
    price: 150,
    description:
      "Traditional multicolor khata with auspicious symbols. Perfect for blessings and ceremonies.",
    image: "/images/khata-multicolor.svg",
    available: true,
    customizable: false,
    category: "Khata",
  },
  {
    id: "khata-red-gold",
    name: "Red & Gold Khata",
    price: 200,
    description:
      "Premium red and gold khata with traditional patterns. Ideal for special occasions and spiritual practices.",
    image: "/images/khata-red-gold.svg",
    available: true,
    customizable: false,
    category: "Khata",
  },
  {
    id: "khata-white",
    name: "White Khata",
    price: 120,
    description:
      "Pure white khata symbolizing peace and purity. Commonly used for blessings and offerings.",
    image: "/images/khata-white.svg",
    available: true,
    customizable: false,
    category: "Khata",
  },
];

// Mock Flag products
export const flagProducts: Bouquet[] = [
  {
    id: "flag-4ft",
    name: "4ft Prayer Flag Set",
    price: 400,
    description:
      "Traditional 4ft prayer flag with auspicious symbols. Brings blessings and positive energy.",
    image: "/images/flag-4ft.svg",
    available: true,
    customizable: false,
    category: "Flag",
  },
  {
    id: "flag-5ft",
    name: "5ft Prayer Flag Set",
    price: 600,
    description:
      "Premium 5ft prayer flag set with vibrant colors and intricate designs. Perfect for homes and temples.",
    image: "/images/flag-5ft.svg",
    available: true,
    customizable: false,
    category: "Flag",
  },
  {
    id: "flag-tibetan",
    name: "Tibetan Prayer Flag Bundle",
    price: 500,
    description:
      "Authentic Tibetan prayer flags with traditional mantras. Set of 5 flags for sustained blessings.",
    image: "/images/flag-tibetan.svg",
    available: true,
    customizable: false,
    category: "Flag",
  },
];

export const allProducts: Bouquet[] = [...bouquets, ...khataProducts, ...flagProducts];

export function getBouquetById(id: string): Bouquet | undefined {
  return allProducts.find((b) => b.id === id);
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
