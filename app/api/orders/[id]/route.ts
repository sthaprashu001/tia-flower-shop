import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDatabaseConfigured, connectToDatabase } from "@/lib/mongodb";
import Order from "@/models/Order";
import { Order as OrderType, OrderStatus } from "@/lib/types";

// Same in-memory fallback array as app/api/orders/route.ts — this relies
// on Node's module cache sharing `global` within one server process. On
// serverless platforms each function instance may have its own memory,
// so this fallback (like the rest of Phase 1's mock storage) is only
// reliable for local development, not production without MONGODB_URI.
declare global {
  // eslint-disable-next-line no-var
  var _mockOrders: OrderType[] | undefined;
}
const mockOrders: OrderType[] = global._mockOrders || [];
global._mockOrders = mockOrders;

const VALID_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "DELIVERED",
  "CANCELLED",
  "REJECTED",
];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status } = await req.json();
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  if (isDatabaseConfigured()) {
    try {
      await connectToDatabase();
      const order = await Order.findByIdAndUpdate(params.id, { status }, { new: true }).lean();
      if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
      return NextResponse.json({ order: { ...order, id: String((order as { _id: unknown })._id) } });
    } catch (err) {
      console.error("Failed to update order status:", err);
      return NextResponse.json({ error: "Could not update order." }, { status: 500 });
    }
  }

  const order = mockOrders.find((o) => o.id === params.id);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  order.status = status;
  return NextResponse.json({ order });
}

// DELETE /api/orders/[id] — permanently remove an order from the
// dashboard (e.g. once it's delivered, or a mistaken/spam order).
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDatabaseConfigured()) {
    try {
      await connectToDatabase();
      const order = await Order.findByIdAndDelete(params.id);
      if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
      return NextResponse.json({ ok: true });
    } catch (err) {
      console.error("Failed to delete order:", err);
      return NextResponse.json({ error: "Could not delete order." }, { status: 500 });
    }
  }

  const index = mockOrders.findIndex((o) => o.id === params.id);
  if (index === -1) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  mockOrders.splice(index, 1);
  return NextResponse.json({ ok: true });
}
