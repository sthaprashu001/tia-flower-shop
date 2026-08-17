import { NextRequest, NextResponse } from "next/server";
import { getBouquetById } from "@/lib/data";
import { isDatabaseConfigured, connectToDatabase } from "@/lib/mongodb";
import Order from "@/models/Order";
import { Order as OrderType, OrderInput } from "@/lib/types";

/**
 * PHASE 1 fallback storage.
 * Without MONGODB_URI set, orders are kept in memory so you can test
 * the full flow locally. They disappear when the dev server restarts —
 * that's expected. Set MONGODB_URI in .env.local to persist for real.
 */
declare global {
  // eslint-disable-next-line no-var
  var _mockOrders: OrderType[] | undefined;
}
const mockOrders: OrderType[] = global._mockOrders || [];
global._mockOrders = mockOrders;

function generateOrderNumber() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `TIA${n}`;
}

function computeTotal(items: OrderInput["items"]) {
  return items.reduce((sum, item) => {
    const bouquet = getBouquetById(item.bouquetId);
    if (!bouquet) return sum;
    return sum + bouquet.price * item.quantity;
  }, 0);
}

function validate(body: Partial<OrderInput>): string | null {
  if (!body.customerName?.trim()) return "Name is required.";
  if (!body.phone?.trim()) return "Phone/WhatsApp number is required.";
  if (!body.items || body.items.length === 0) return "Select at least one bouquet.";
  if (!body.date) return "Date is required.";
  if (!body.time) return "Time is required.";
  if (!body.meetingLocation?.trim()) return "Meeting location near TIA is required.";
  for (const item of body.items) {
    const b = getBouquetById(item.bouquetId);
    if (!b) return `Unknown bouquet: ${item.bouquetId}`;
    if (!b.available) return `"${b.name}" is not available today.`;
    if (item.quantity < 1) return "Quantity must be at least 1.";
  }
  return null;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<OrderInput>;

  const error = validate(body);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const total = computeTotal(body.items!);
  const orderNumber = generateOrderNumber();

  const orderDoc: OrderType = {
    id: orderNumber,
    orderNumber,
    customerName: body.customerName!.trim(),
    phone: body.phone!.trim(),
    items: body.items!,
    date: body.date!,
    time: body.time!,
    meetingLocation: body.meetingLocation!.trim(),
    customizationNote: body.customizationNote?.trim() || "",
    personalMessage: body.personalMessage?.trim() || "",
    urgent: Boolean(body.urgent),
    total,
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };

  if (isDatabaseConfigured()) {
    try {
      await connectToDatabase();
      await Order.create(orderDoc);
    } catch (err) {
      console.error("Failed to save order to database:", err);
      return NextResponse.json({ error: "Could not save order. Please try again." }, { status: 500 });
    }
  } else {
    mockOrders.unshift(orderDoc);
  }

  return NextResponse.json({ order: orderDoc }, { status: 201 });
}

// GET /api/orders?key=ADMIN_API_KEY — used by the admin dashboard.
// This is a lightweight placeholder, NOT real authentication.
// Replace with proper admin login (Phase 3) before going live.
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  const expected = process.env.ADMIN_API_KEY;

  if (!expected || key !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDatabaseConfigured()) {
    try {
      await connectToDatabase();
      const orders = await Order.find().sort({ createdAt: -1 }).lean();
      return NextResponse.json({ source: "database", orders });
    } catch (err) {
      console.error("Failed to load orders from database:", err);
      return NextResponse.json({ error: "Database unreachable" }, { status: 500 });
    }
  }

  return NextResponse.json({ source: "mock", orders: mockOrders });
}
