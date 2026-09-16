export type ShopStatus = "OPEN" | "BUSY" | "CLOSED";

export interface Bouquet {
  id: string;
  name: string;
  price: number; // in NPR
  description: string;
  image: string;
  available: boolean;
  customizable: boolean;
  category: string; // "Bouquets", "Khata", "Flags", etc.
}

export interface OrderItem {
  bouquetId: string;
  quantity: number;
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
  personalMessage?: string;
  urgent?: boolean;
}

export interface Order extends OrderInput {
  id: string;
  orderNumber: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
}
