import { NextRequest, NextResponse } from "next/server";
import { isDatabaseConfigured, connectToDatabase } from "@/lib/mongodb";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rateLimit";
import { isPhone, normalizePhone } from "@/lib/validation";
import { mockOrders } from "@/lib/mockStore";
import Order from "@/models/Order";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

// "Sita Sharma" -> "Sita": the tracking page doesn't need the full name.
function firstName(name: string): string {
  return (name || "").trim().split(/\s+/)[0] || "";
}

// GET /api/orders/track?orderNumber=TIA12345678&phone=98XXXXXXXX  (public)
//
// Both the order number AND the phone must match. The response leaves out the
// phone number and shows only the customer's first name.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNumber = (searchParams.get("orderNumber") || "").trim().toUpperCase();
    const phone = searchParams.get("phone") || "";

    // Two limits: per visitor, and per order number (so guessing phones for one
    // order from many IPs is throttled too).
    const byIp = await rateLimit(`track:${clientIp(req.headers)}`, 40, 10 * 60_000);
    if (!byIp.ok) return tooManyRequests(byIp.retryAfter);
    if (orderNumber) {
      const byOrder = await rateLimit(`track-order:${orderNumber}`, 30, 10 * 60_000);
      if (!byOrder.ok) return tooManyRequests(byOrder.retryAfter);
    }

    if (!orderNumber || !phone) {
      return NextResponse.json({ error: "Order number and phone are required" }, { status: 400, headers: noStore });
    }
    if (!/^TIA\d{4,8}$/.test(orderNumber) || !isPhone(phone)) {
      // Same answer as a real miss, so the format check leaks nothing.
      return NextResponse.json({ error: "Order not found" }, { status: 404, headers: noStore });
    }

    // Orders saved before phone numbers were normalised keep their original text.
    const phoneForms = Array.from(new Set([phone.trim(), normalizePhone(phone)]));

    let found: {
      orderNumber: string;
      customerName: string;
      items: { bouquetId: string; quantity: number; name?: string; unitPrice?: number }[];
      date: string;
      time: string;
      meetingLocation: string;
      customizationNote?: string;
      urgent?: boolean;
      total: number;
      status: string;
      createdAt?: unknown;
      updatedAt?: unknown;
    } | null = null;

    if (isDatabaseConfigured()) {
      await connectToDatabase();
      found = await Order.findOne({ orderNumber, phone: { $in: phoneForms } }).lean();
    } else {
      found = mockOrders().find((o) => o.orderNumber === orderNumber && phoneForms.includes(o.phone)) || null;
    }

    if (!found) {
      return NextResponse.json({ error: "Order not found" }, { status: 404, headers: noStore });
    }

    return NextResponse.json(
      {
        order: {
          orderNumber: found.orderNumber,
          firstName: firstName(found.customerName),
          items: found.items.map((i) => ({ bouquetId: i.bouquetId, quantity: i.quantity, name: i.name, unitPrice: i.unitPrice })),
          date: found.date,
          time: found.time,
          meetingLocation: found.meetingLocation,
          customizationNote: found.customizationNote || "",
          urgent: found.urgent === true,
          total: found.total,
          status: found.status,
          createdAt: found.createdAt,
          updatedAt: found.updatedAt || found.createdAt,
        },
      },
      { headers: noStore }
    );
  } catch (err) {
    console.error("Failed to track order:", err);
    return NextResponse.json({ error: "Could not track order" }, { status: 500, headers: noStore });
  }
}
