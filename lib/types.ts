export type ShopStatus = "OPEN" | "BUSY" | "CLOSED";

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
  todayPick?: boolean; // admin-curated: show in the homepage "Today's items" section
}

/** All photos of a product for sliders; falls back to the single cover image. */
export function productImages(p: { image?: string; images?: string[] }): string[] {
  if (p.images && p.images.length > 0) return p.images.filter(Boolean);
  return p.image ? [p.image] : [];
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
