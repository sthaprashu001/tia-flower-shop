import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireAdmin } from "@/lib/guards";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rateLimit";
import { cleanText, isIsoDate, isPhone, isTime } from "@/lib/validation";
import { getBouquetById } from "@/lib/products";
import { getShopSettings } from "@/lib/shopSettings";
import { isDatabaseConfigured, connectToDatabase } from "@/lib/mongodb";
import { sendWhatsAppNotificationToAdmins } from "@/lib/whatsapp";
import Order from "@/models/Order";
import { Order as OrderType, OrderInput } from "@/lib/types";

// Order notification hook. Deliberately logs only the order number: customer
// names, phone numbers and addresses must not end up in server logs.
// To send real emails, call your provider (e.g. Resend) here using
// process.env.ADMIN_EMAIL (server-only) and RESEND_API_KEY.
async function sendOrderNotification(order: OrderType) {
  try {
    console.log(`New order received: ${order.orderNumber}`);
  } catch (error) {
    console.error("Failed to send order notification:", error);
    // Don't fail the order if email fails
  }
}

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

// 6 random digits from the OS CSPRNG (1,000,000 combinations instead of 9,000),
// so order numbers can't be guessed by counting up or by brute force.
function generateOrderNumber() {
  return `TIA${crypto.randomInt(100000, 1000000)}`;
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

type ParsedOrder = Omit<OrderInput, "urgent"> & { urgent: boolean };

// Every field arrives as `unknown`; nothing is trusted until it's checked here.
async function parseOrder(raw: unknown): Promise<{ error: string } | { data: ParsedOrder }> {
  if (!raw || typeof raw !== "object") return { error: "Invalid request." };
  const b = raw as Record<string, unknown>;

  const customerName = cleanText(b.customerName, 100);
  if (!customerName) return { error: "Name is required." };

  if (!isPhone(b.phone)) return { error: "Please enter a valid phone/WhatsApp number." };
  const phone = (b.phone as string).trim();

  if (!Array.isArray(b.items) || b.items.length === 0) return { error: "Select at least one bouquet." };
  if (b.items.length > 20) return { error: "Too many items in one order." };

  const items: OrderInput["items"] = [];
  for (const it of b.items) {
    const line = (it && typeof it === "object" ? it : {}) as Record<string, unknown>;
    const quantity = line.quantity;
    if (typeof line.bouquetId !== "string" || line.bouquetId.length === 0 || line.bouquetId.length > 64) {
      return { error: "Invalid bouquet in your order." };
    }
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      return { error: "Quantity must be a whole number between 1 and 50." };
    }
    const bouquet = await getBouquetById(line.bouquetId);
    if (!bouquet) return { error: "One of the bouquets in your order no longer exists." };
    if (!bouquet.available) return { error: `"${bouquet.name}" is not available today.` };
    items.push({ bouquetId: line.bouquetId, quantity });
  }

  if (!isIsoDate(b.date)) return { error: "Date is required." };
  // Pickup date must be today (allowing for timezone differences) up to 90 days ahead.
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = (new Date(`${b.date}T00:00:00Z`).getTime() - Date.now()) / dayMs;
  if (diffDays < -1.5 || diffDays > 90) return { error: "Please choose a pickup date within the next 90 days." };

  if (!isTime(b.time)) return { error: "Time is required." };

  const meetingLocation = cleanText(b.meetingLocation, 200);
  if (!meetingLocation) return { error: "Meeting location near TIA is required." };

  return {
    data: {
      customerName,
      phone,
      items,
      date: b.date,
      time: b.time,
      meetingLocation,
      customizationNote: cleanText(b.customizationNote, 500),
      personalMessage: cleanText(b.personalMessage, 300),
      urgent: b.urgent === true,
    },
  };
}

export async function POST(req: NextRequest) {
  // Stop scripted order spam: 6 orders per 10 minutes per IP.
  const limit = rateLimit(`order:${clientIp(req.headers)}`, 6, 10 * 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = await parseOrder(raw);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const input = parsed.data;

  const { capacityPerHour } = await getShopSettings();
  const existingInHour = await countOrdersInSameHour(input.date, input.time);
  if (existingInHour >= capacityPerHour) {
    return NextResponse.json(
      {
        error: `That time slot is fully booked (${existingInHour}/${capacityPerHour} orders). Please choose a different time.`,
      },
      { status: 409 }
    );
  }

  // Price is always recomputed on the server from the catalog — never taken from the client.
  const total = await computeTotal(input.items);

  const buildDoc = (orderNumber: string): OrderType => ({
    id: orderNumber,
    orderNumber,
    customerName: input.customerName,
    phone: input.phone,
    items: input.items,
    date: input.date,
    time: input.time,
    meetingLocation: input.meetingLocation,
    customizationNote: input.customizationNote || "",
    personalMessage: input.personalMessage || "",
    urgent: input.urgent,
    total,
    status: "PENDING",
    createdAt: new Date().toISOString(),
  });

  let orderDoc: OrderType | null = null;

  if (isDatabaseConfigured()) {
    try {
      await connectToDatabase();
      // Retry on the (unlikely) event of a duplicate order number.
      for (let attempt = 0; attempt < 5 && !orderDoc; attempt++) {
        const candidate = buildDoc(generateOrderNumber());
        try {
          await Order.create(candidate);
          orderDoc = candidate;
        } catch (err) {
          if ((err as { code?: number }).code !== 11000) throw err;
        }
      }
    } catch (err) {
      console.error("Failed to save order to database:", err);
      return NextResponse.json({ error: "Could not save order. Please try again." }, { status: 500 });
    }
    if (!orderDoc) {
      return NextResponse.json({ error: "Could not save order. Please try again." }, { status: 500 });
    }
  } else {
    orderDoc = buildDoc(generateOrderNumber());
    mockOrders.unshift(orderDoc);
  }

  // Send notification to admin
  await sendOrderNotification(orderDoc);

  return NextResponse.json({ order: orderDoc }, { status: 201 });
}

// GET /api/orders — admin dashboard (active orders), or customers looking up their own orders by phone.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");
  const status = searchParams.get("status");

  // If phone provided, it's a customer checking their order (no login).
  // Because it is public, it is rate limited and never returns the customer's name.
  if (phone) {
    const limit = rateLimit(`order-lookup:${clientIp(req.headers)}`, 15, 10 * 60_000);
    if (!limit.ok) return tooManyRequests(limit.retryAfter);

    if (!isPhone(phone)) {
      return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });
    }
    const cleanPhone = phone.trim();

    if (isDatabaseConfigured()) {
      try {
        await connectToDatabase();
        const orders = await Order.find({ phone: cleanPhone })
          .select("-customerName -phone")
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
        return NextResponse.json({
          source: "database",
          orders: orders.map((o) => ({ ...o, id: String(o._id), _id: String(o._id) })),
        });
      } catch (err) {
        console.error("Failed to load orders:", err);
        return NextResponse.json({ error: "Could not fetch orders" }, { status: 500 });
      }
    }

    // Mock mode
    const customerOrders = mockOrders
      .filter((o) => o.phone === cleanPhone)
      .map(({ customerName: _n, phone: _p, ...rest }) => rest);
    return NextResponse.json({ source: "mock", orders: customerOrders });
  }

  // Admin endpoint - requires an active admin
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  // If status filter provided (e.g., "COMPLETED")
  const query: Record<string, unknown> = {};
  if (status === "COMPLETED") {
    query.status = "DELIVERED";
  } else if (status === "ACTIVE") {
    query.status = { $nin: ["DELIVERED", "CANCELLED", "REJECTED"] };
  }

  if (isDatabaseConfigured()) {
    try {
      await connectToDatabase();
      // Default: show only active orders
      const finalQuery = Object.keys(query).length > 0 ? query : { status: { $nin: ["DELIVERED", "CANCELLED", "REJECTED"] } };
      const rawOrders = await Order.find(finalQuery).sort({ createdAt: -1 }).lean();
      const orders = rawOrders.map((o) => ({ ...o, id: String(o._id), _id: String(o._id) }));
      return NextResponse.json({ source: "database", orders });
    } catch (err) {
      console.error("Failed to load orders from database:", err);
      return NextResponse.json({ error: "Database unreachable" }, { status: 500 });
    }
  }

  // Mock mode
  let activeOrders = mockOrders.filter((o) => !["DELIVERED", "CANCELLED", "REJECTED"].includes(o.status));
  if (status === "COMPLETED") {
    activeOrders = mockOrders.filter((o) => o.status === "DELIVERED");
  }
  return NextResponse.json({ source: "mock", orders: activeOrders });
}
