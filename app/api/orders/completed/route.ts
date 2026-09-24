import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guards";
import { isDatabaseConfigured, connectToDatabase } from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if ("error" in auth) return auth.error;

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    await connectToDatabase();

    // Get only completed orders (DELIVERED, CANCELLED, REJECTED)
    const orders = await Order.find({
      status: { $in: ["DELIVERED", "CANCELLED", "REJECTED"] },
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      orders: orders.map((o) => ({
        ...o.toObject(),
        id: String(o._id),
      })),
    });
  } catch (err) {
    console.error("Failed to fetch completed orders:", err);
    return NextResponse.json(
      { error: "Could not fetch orders" },
      { status: 500 }
    );
  }
}
