export type ShopStatus = "OPEN" | "BUSY" | "CLOSED";

/**
 * What kind of product this is. Shown to customers as a small badge so nobody
 * mistakes a long-lasting (artificial) bouquet for fresh flowers.
 *   fresh      → real, fresh flowers
 *   artificial → artificial / ribbon / handmade, long-lasting
 *   other      → khata, flags, gifts and anything that is not a bouquet
 */
export const PRODUCT_KINDS = ["fresh", "artificial", "other"] as const;
export type ProductKind = (typeof PRODUCT_KINDS)[number];

export interface Bouquet {
  id: string;
  name: string;
  price: number; // in NPR
  description: string;
  image: string; // cover photo
  images?: string[]; // slider photos (first = cover)
  available: boolean;
  customizable: boolean;
  category: string; // "Bouquets", "Khata", "Flags", etc.
  featured?: boolean; // appears on homepage
  featuredOrder?: number; // display order (1-7)
  cost?: number; // admin-only; never sent to customers
  leadTimeMinutes?: number; // customers must order this many minutes before pickup (0 = no minimum)
  todayPick?: boolean; // admin-curated: "Best sellers" row on the homepage
  kind?: ProductKind; // fresh / artificial / other (unset on older products)
  sizeNote?: string; // short size note, e.g. "7 roses" or "Regular · 12 stems"
  catalogOrder?: number; // admin-chosen position in "All products" (0 = not numbered)
  categoryOrder?: number; // admin-chosen position inside its own category section (0 = not numbered)
}

/** Homepage "tossed photos" slots: positions 1–12. */
export const MAX_HOME_POSITION = 12;
/** Catalog positions: 1–999 (0 or blank = not numbered, shown after the numbered ones). */
export const MAX_CATALOG_POSITION = 999;

/**
 * Orders a list by the admin's position numbers: numbered products first
 * (lowest number first), then everything without a number in the order it
 * arrived (newest first). Ties keep the incoming order. Never mutates `list`.
 */
export function sortByPosition<T extends { catalogOrder?: number; categoryOrder?: number }>(
  list: T[],
  key: "catalogOrder" | "categoryOrder"
): T[] {
  return list
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const x = a.item[key] || 0;
      const y = b.item[key] || 0;
      if (x > 0 && y > 0) return x - y || a.index - b.index;
      if (x > 0) return -1;
      if (y > 0) return 1;
      return a.index - b.index;
    })
    .map((e) => e.item);
}

/** All photos of a product for sliders; falls back to the single cover image. */
export function productImages(p: { image?: string; images?: string[] }): string[] {
  if (p.images && p.images.length > 0) return p.images.filter(Boolean);
  return p.image ? [p.image] : [];
}

/**
 * The product's kind. Uses the admin's choice when set; otherwise anything
 * outside the "Bouquets" category (khata, flags…) counts as "other", and an
 * unclassified bouquet stays undefined (no badge) until the admin picks one.
 */
export function productKind(p: { kind?: string; category?: string }): ProductKind | undefined {
  if (p.kind && (PRODUCT_KINDS as readonly string[]).includes(p.kind)) return p.kind as ProductKind;
  if (p.category && p.category !== "Bouquets") return "other";
  return undefined;
}

/** Honest wording for image alt text (never calls an artificial bouquet "fresh"). */
export function productNoun(p: { kind?: string; category?: string }): string {
  const kind = productKind(p);
  if (kind === "fresh") return "fresh flower bouquet";
  if (kind === "artificial") return "long-lasting artificial bouquet";
  if (p.category === "Khata") return "khata";
  if (p.category === "Flag" || p.category === "Flags") return "prayer flag";
  return "bouquet";
}

export interface OrderItem {
  bouquetId: string;
  quantity: number;
  // Snapshot taken when the order is placed, so later renames / price
  // changes don't rewrite order history. Older orders won't have these.
  name?: string;
  unitPrice?: number;
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "DELIVERED"
  | "CANCELLED"
  | "REJECTED";

export interface OrderInput {
  customerName: string;
  phone: string;
  items: OrderItem[];
  date: string; // ISO date, e.g. 2026-08-20
  time: string; // e.g. 18:30
  meetingLocation: string;
  customizationNote?: string;
  urgent?: boolean;
}

export interface Order extends OrderInput {
  id: string;
  orderNumber: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
}
