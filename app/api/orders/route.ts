import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBouquetById } from "@/lib/products";
import { getShopSettings } from "@/lib/shopSettings";
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

// Groups orders into hour-long slots by date + the hour portion of the
// requested time (e.g. "14:30" -> hour "14"), so "8 orders per hour" means
// per requested pickup hour, not per hour the order was placed.
function hourBucket(date: string, time: string) {
  return `${date}T${time.slice(0, 2)}`;
}

async function countOrdersInSameHour(date: string, time: string, excludeOrderId?: string) {
  const targetBucket = hourBucket(date, time);
  const activeStatuses = ["PENDING", "CONFIRMED", "PREPARING", "READY", "DELIVERED"];

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const candidates = await Order.find({ date, status: { $in: activeStatuses } })
      .select("time _id")
      .lean<{ _id: unknown; time: string }[]>();
    return candidates.filter(
      (o) => hourBucket(date, o.time) === targetBucket && String(o._id) !== excludeOrderId
    ).length;
  }

  return mockOrders.filter(
    (o) =>
      o.date === date &&
      activeStatuses.includes(o.status) &&
      hourBucket(o.date, o.time) === targetBucket &&
      o.id !== excludeOrderId
  ).length;
}

async function computeTotal(items: OrderInput["items"]) {
  let total = 0;
  for (const item of items) {
    const bouquet = await getBouquetById(item.bouquetId);
    if (bouquet) total += bouquet.price * item.quantity;
  }
  return total;
}

async function validate(body: Partial<OrderInput>): Promise<string | null> {
  if (!body.customerName?.trim()) return "Name is required.";
  if (!body.phone?.trim()) return "Phone/WhatsApp number is required.";
  if (!body.items || body.items.length === 0) return "Select at least one bouquet.";
  if (!body.date) return "Date is required.";
  if (!body.time) return "Time is required.";
  if (!body.meetingLocation?.trim()) return "Meeting location near TIA is required.";
  for (const item of body.items) {
    const b = await getBouquetById(item.bouquetId);
    if (!b) return `Unknown bouquet: ${item.bouquetId}`;
    if (!b.available) return `"${b.name}" is not available today.`;
    if (item.quantity < 1) return "Quantity must be at least 1.";
  }
  return null;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<OrderInput>;

  const error = await validate(body);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const { capacityPerHour } = await getShopSettings();
  const existingInHour = await countOrdersInSameHour(body.date!, body.time!);
  if (existingInHour >= capacityPerHour) {
    return NextResponse.json(
      {
        error: `That time slot is fully booked (${existingInHour}/${capacityPerHour} orders). Please choose a different time.`,
      },
      { status: 409 }
    );
  }

  const total = await computeTotal(body.items!);
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

// GET /api/orders — used by the admin dashboard. Requires a real
// logged-in admin session (Phase 3) — replaces the old shared key.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDatabaseConfigured()) {
    try {
      await connectToDatabase();
      const rawOrders = await Order.find().sort({ createdAt: -1 }).lean();
      const orders = rawOrders.map((o) => ({ ...o, id: String(o._id), _id: String(o._id) }));
      return NextResponse.json({ source: "database", orders });
    } catch (err) {
      console.error("Failed to load orders from database:", err);
      return NextResponse.json({ error: "Database unreachable" }, { status: 500 });
    }
  }

  return NextResponse.json({ source: "mock", orders: mockOrders });
}
