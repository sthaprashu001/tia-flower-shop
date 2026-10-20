import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guards";
import { isObjectId } from "@/lib/validation";
import { isDatabaseConfigured, connectToDatabase } from "@/lib/mongodb";
import { getShopSettings } from "@/lib/shopSettings";
import { ACTIVE_STATUSES } from "@/lib/orderSlots";
import { DELETABLE, canTransition, isSlotFreeing } from "@/lib/orderStatus";
import { mockOrders } from "@/lib/mockStore";
import Order from "@/models/Order";
import { OrderStatus } from "@/lib/types";

const VALID_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "DELIVERED",
  "CANCELLED",
  "REJECTED",
];

function notAllowed(from: string, to: string) {
  return NextResponse.json({ error: `An order that is ${from} can't be changed to ${to}.` }, { status: 409 });
}

// PATCH /api/orders/[id] — move an order along its status flow (see lib/orderStatus.ts).
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  let body: { status?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const status = body?.status as OrderStatus;
  if (typeof status !== "string" || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  if (isDatabaseConfigured()) {
    if (!isObjectId(params.id)) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    try {
      await connectToDatabase();
      const current = await Order.findById(params.id).select("status date time").lean<{ status: OrderStatus; date: string; time: string } | null>();
      if (!current) return NextResponse.json({ error: "Order not found." }, { status: 404 });
      if (current.status === status) return NextResponse.json({ order: { id: params.id, status } });
      if (!canTransition(current.status, status)) return notAllowed(current.status, status);

      // Reopening a cancelled/rejected order takes its pickup hour back — make sure there's still room.
      if (isSlotFreeing(current.status) && ACTIVE_STATUSES.includes(status)) {
        const settings = await getShopSettings();
        const taken = await Order.countDocuments({
          date: current.date,
          time: { $regex: `^${current.time.slice(0, 2)}:` },
          status: { $in: ACTIVE_STATUSES },
        });
        if (taken >= settings.capacityPerHour) {
          return NextResponse.json(
            { error: "That pickup hour is full now, so this order can't be reopened." },
            { status: 409 }
          );
        }
      }

      // Only update if nobody else changed it in the meantime.
      const order = await Order.findOneAndUpdate(
        { _id: params.id, status: current.status },
        { status },
        { new: true }
      ).lean();
      if (!order) {
        return NextResponse.json({ error: "This order was just updated by someone else. Refresh and try again." }, { status: 409 });
      }
      return NextResponse.json({ order: { ...order, id: String((order as { _id: unknown })._id) } });
    } catch (err) {
      console.error("Failed to update order status:", err);
      return NextResponse.json({ error: "Could not update order." }, { status: 500 });
    }
  }

  const order = mockOrders().find((o) => o.id === params.id);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.status !== status && !canTransition(order.status, status)) return notAllowed(order.status, status);
  order.status = status;
  return NextResponse.json({ order });
}

// DELETE /api/orders/[id] — permanently remove a dead (cancelled / rejected)
// order. Orders that are live or delivered are kept so sales history and
// audit trails stay intact.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const notDeletable = NextResponse.json(
    { error: "Only cancelled or rejected orders can be deleted. Cancel or reject it first." },
    { status: 409 }
  );

  if (isDatabaseConfigured()) {
    if (!isObjectId(params.id)) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    try {
      await connectToDatabase();
      const order = await Order.findOneAndDelete({ _id: params.id, status: { $in: DELETABLE } });
      if (!order) {
        const exists = await Order.exists({ _id: params.id });
        return exists ? notDeletable : NextResponse.json({ error: "Order not found." }, { status: 404 });
      }
      return NextResponse.json({ ok: true });
    } catch (err) {
      console.error("Failed to delete order:", err);
      return NextResponse.json({ error: "Could not delete order." }, { status: 500 });
    }
  }

  const list = mockOrders();
  const index = list.findIndex((o) => o.id === params.id);
  if (index === -1) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (!DELETABLE.includes(list[index].status)) return notDeletable;
  list.splice(index, 1);
  return NextResponse.json({ ok: true });
}
