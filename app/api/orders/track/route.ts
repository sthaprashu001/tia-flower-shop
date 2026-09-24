import { NextRequest, NextResponse } from "next/server";
import { isDatabaseConfigured, connectToDatabase } from "@/lib/mongodb";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rateLimit";
import { isPhone } from "@/lib/validation";
import Order from "@/models/Order";

// GET - Track order by order number and phone (public endpoint)
export async function GET(req: NextRequest) {
  try {
    // Public lookup: limit guessing of order-number/phone pairs.
    const limit = rateLimit(`track:${clientIp(req.headers)}`, 10, 10 * 60_000);
    if (!limit.ok) return tooManyRequests(limit.retryAfter);

    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get("orderNumber");
    const phone = searchParams.get("phone");

    if (!orderNumber || !phone) {
      return NextResponse.json(
        { error: "Order number and phone are required" },
        { status: 400 }
      );
    }
    if (!/^TIA\d{4,8}$/i.test(orderNumber.trim()) || !isPhone(phone)) {
      // Same answer as a real miss, so the format check leaks nothing.
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    await connectToDatabase();

    // Find order by number and phone (for verification)
    const order = await Order.findOne({
      orderNumber: orderNumber.toUpperCase().trim(),
      phone: phone.trim(),
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      order: {
        _id: String(order._id),
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        phone: order.phone,
        items: order.items,
        date: order.date,
        time: order.time,
        meetingLocation: order.meetingLocation,
        customizationNote: order.customizationNote,
        personalMessage: order.personalMessage,
        urgent: order.urgent,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (err) {
    console.error("Failed to track order:", err);
    return NextResponse.json(
      { error: "Could not track order" },
      { status: 500 }
    );
  }
}
