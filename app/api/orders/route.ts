import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireAdmin } from "@/lib/guards";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rateLimit";
import { cleanText, isIsoDate, isPhone, isTime } from "@/lib/validation";
import { getBouquetById } from "@/lib/products";
import { getShopSettings, ShopSettingsValue } from "@/lib/shopSettings";
import { getHourCounts, suggestSlots } from "@/lib/orderSlots";
import { SHOP_UTC_OFFSET_MINUTES, addDaysIso, earliestPickupMs, formatPickup, leadTimeLabel, pickupInstantMs, shopToday } from "@/lib/time";
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

type ParsedOrder = Omit<OrderInput, "urgent"> & { urgent: boolean };
type ParseFailure = { error: string; extra?: Record<string, unknown> };

const pad = (h: number) => `${String(h).padStart(2, "0")}:00`;

// Every field arrives as `unknown`; nothing is trusted until it's checked here.
async function parseOrder(
  raw: unknown,
  settings: ShopSettingsValue,
  nowMs: number
): Promise<ParseFailure | { data: ParsedOrder; leadHours: number }> {
  if (!raw || typeof raw !== "object") return { error: "Invalid request." };
  const b = raw as Record<string, unknown>;

  const customerName = cleanText(b.customerName, 100);
  if (!customerName) return { error: "Name is required." };

  if (!isPhone(b.phone)) return { error: "Please enter a valid phone/WhatsApp number." };
  const phone = (b.phone as string).trim();

  if (!Array.isArray(b.items) || b.items.length === 0) return { error: "Select at least one bouquet." };
  if (b.items.length > 20) return { error: "Too many items in one order." };

  const items: OrderInput["items"] = [];
  let leadHours = 0;
  let leadProduct = "";
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
    if (!bouquet.available) return { error: `"${bouquet.name}" is not available today. Please remove it from your cart.` };
    if ((bouquet.leadTimeHours || 0) > leadHours) {
      leadHours = bouquet.leadTimeHours || 0;
      leadProduct = bouquet.name;
    }
    // Name and price are copied from the catalog at order time (never from the client).
    items.push({ bouquetId: line.bouquetId, quantity, name: bouquet.name, unitPrice: bouquet.price });
  }

  if (!isIsoDate(b.date)) return { error: "Date is required." };
  if (!isTime(b.time)) return { error: "Time is required." };
  const date = b.date;
  const time = b.time;

  if (date > addDaysIso(shopToday(nowMs), 90)) return { error: "Please choose a pickup date within the next 90 days." };

  // Pickups only during opening hours (shop time).
  const minutes = Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
  if (minutes < settings.openHour * 60 || minutes >= settings.closeHour * 60) {
    return { error: `We take pickups between ${pad(settings.openHour)} and ${pad(settings.closeHour)}. Please choose a time in that range.` };
  }

  const instant = pickupInstantMs(date, time);
  if (instant < nowMs) return { error: "That pickup time has already passed. Please choose a later time." };

  // Per-product "order at least X before" rule.
  if (leadHours > 0 && instant < earliestPickupMs(nowMs, leadHours)) {
    // Earliest allowed moment expressed in shop time, for a helpful message.
    const earliestShop = new Date(earliestPickupMs(nowMs, leadHours) + SHOP_UTC_OFFSET_MINUTES * 60_000).toISOString();
    return {
      error: `"${leadProduct}" must be ordered at least ${leadTimeLabel(leadHours)} before pickup. The earliest pickup for this order is ${formatPickup(earliestShop.slice(0, 10), earliestShop.slice(11, 16))}.`,
      extra: { leadTimeHours: leadHours, earliestDate: earliestShop.slice(0, 10), earliestTime: earliestShop.slice(11, 16) },
    };
  }

  const meetingLocation = cleanText(b.meetingLocation, 200);
  if (!meetingLocation) return { error: "Meeting location near TIA is required." };

  return {
    leadHours,
    data: {
      customerName,
      phone,
      items,
      date,
      time,
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

  const nowMs = Date.now();
  const settings = await getShopSettings();

  const parsed = await parseOrder(raw, settings, nowMs);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error, ...parsed.extra }, { status: 400 });
  }
  const input = parsed.data;

  // Hourly capacity — on a full slot, offer the nearest free ones.
  const counts = await getHourCounts(input.date);
  const existingInHour = counts[input.time.slice(0, 2)] || 0;
  if (existingInHour >= settings.capacityPerHour) {
    const suggestions = suggestSlots({
      date: input.date,
      requestedTime: input.time,
      counts,
      capacityPerHour: settings.capacityPerHour,
      openHour: settings.openHour,
      closeHour: settings.closeHour,
      leadHours: parsed.leadHours,
      nowMs,
    });
    return NextResponse.json(
      {
        error:
          suggestions.length > 0
            ? `That time slot is fully booked. These nearby times are free: ${suggestions.join(", ")}.`
            : "That time slot is fully booked, and nothing else is free that day. Please try another date.",
        suggestions,
      },
      { status: 409 }
    );
  }

  // Price is always recomputed on the server from the catalog — never taken from the client.
  const total = input.items.reduce((sum, i) => sum + (i.unitPrice || 0) * i.quantity, 0);

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

  // Tell the shop team (WhatsApp) — never blocks or fails the customer's order.
  await sendOrderNotification(orderDoc);
  await sendWhatsAppNotificationToAdmins({
    orderNumber: orderDoc.orderNumber,
    customerName: orderDoc.customerName,
    phone: orderDoc.phone,
    date: orderDoc.date,
    time: orderDoc.time,
    location: orderDoc.meetingLocation,
    total: orderDoc.total,
    urgent: orderDoc.urgent === true,
    items: orderDoc.items,
  });

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
