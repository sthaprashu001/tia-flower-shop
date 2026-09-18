import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBouquetById } from "@/lib/products";
import { getShopSettings } from "@/lib/shopSettings";
import { isDatabaseConfigured, connectToDatabase } from "@/lib/mongodb";
import { sendWhatsAppNotificationToAdmins } from "@/lib/whatsapp";
import Order from "@/models/Order";
import { Order as OrderType, OrderInput } from "@/lib/types";

// Send email notification when order is placed
async function sendOrderNotification(order: OrderType) {
  try {
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || process.env.NEXT_AUTH_EMAIL_FROM || "orders@tiaflowershop.online";
    
    const emailBody = `
New Order Received! 🌹

Order Number: ${order.orderNumber}
Customer: ${order.customerName}
Phone: ${order.phone}
Total: Rs. ${order.total}

Pickup Date: ${order.date}
Pickup Time: ${order.time}
Location: ${order.meetingLocation}

Urgent: ${order.urgent ? "YES 🚨" : "No"}

Items:
${order.items.map((i) => `- Bouquet ID: ${i.bouquetId}, Qty: ${i.quantity}`).join("\n")}

Customization: ${order.customizationNote || "None"}
Message: ${order.personalMessage || "None"}

Status: PENDING

---
View and manage this order:
https://tiaflowershop.online/admin/orders
    `;

    // Uncomment below if using Resend or another email service
    // await fetch("https://api.resend.com/emails", {
    //   method: "POST",
    //   headers: {
    //     "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     from: "orders@tiaflowershop.online",
    //     to: adminEmail,
    //     subject: `New Order: ${order.orderNumber}`,
    //     text: emailBody,
    //   }),
    // });

    console.log(`📧 Order notification for ${order.orderNumber} ready to send to ${adminEmail}`);
    console.log(emailBody);
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

  // Send notification to admin
  await sendOrderNotification(orderDoc);

  return NextResponse.json({ order: orderDoc }, { status: 201 });
}

// GET /api/orders — used by admin dashboard (shows active orders) or customers (with phone filter)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");
  const status = searchParams.get("status");

  // If phone provided, it's a customer checking their order (no auth required)
  if (phone) {
    if (isDatabaseConfigured()) {
      try {
        await connectToDatabase();
        const orders = await Order.find({ phone: phone.trim() }).sort({ createdAt: -1 }).lean();
        return NextResponse.json({ 
          source: "database", 
          orders: orders.map((o) => ({ ...o, id: String(o._id), _id: String(o._id) }))
        });
      } catch (err) {
        console.error("Failed to load orders:", err);
        return NextResponse.json({ error: "Could not fetch orders" }, { status: 500 });
      }
    }

    // Mock mode
    const customerOrders = mockOrders.filter(o => o.phone === phone.trim());
    return NextResponse.json({ source: "mock", orders: customerOrders });
  }

  // Admin endpoint - requires authentication
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // If status filter provided (e.g., "COMPLETED")
  let query: any = {};
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
  let activeOrders = mockOrders.filter(o => !["DELIVERED", "CANCELLED", "REJECTED"].includes(o.status));
  if (status === "COMPLETED") {
    activeOrders = mockOrders.filter(o => o.status === "DELIVERED");
  }
  return NextResponse.json({ source: "mock", orders: activeOrders });
}
