"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface OrderItem {
  bouquetId: string;
  quantity: number;
}

interface Order {
  _id: string;
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  items: OrderItem[];
  date: string;
  time: string;
  meetingLocation: string;
  customizationNote?: string;
  personalMessage?: string;
  urgent: boolean;
  total: number;
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED" | "REJECTED";
  createdAt?: string;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("PENDING");

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/admin/login");
      return;
    }

    loadOrders();
  }, [authStatus, router]);

  async function loadOrders() {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        loadOrders();
      }
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  }

  const filteredOrders = orders.filter((o) => filter === "ALL" || o.status === filter);
  const pendingCount = orders.filter((o) => o.status === "PENDING").length;
  const readyCount = orders.filter((o) => o.status === "READY").length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl italic text-charcoal">Orders</h1>
          <p className="mt-2 text-sm text-charcoal/70">
            {pendingCount} pending • {readyCount} ready for pickup
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="text-sm text-charcoal/60 hover:text-rose-dark"
        >
          ← Back to dashboard
        </button>
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {["PENDING", "CONFIRMED", "PREPARING", "READY", "DELIVERED", "ALL"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition ${
              filter === status
                ? "bg-rose text-white"
                : "bg-sand text-charcoal hover:bg-sand/70"
            }`}
          >
            {status}
            {status === "PENDING" && pendingCount > 0 && (
              <span className="ml-2 inline-block h-5 w-5 rounded-full bg-yellow-400 text-xs font-bold text-charcoal">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="rounded-card border border-sand p-8 text-center">
          <p className="text-charcoal/60">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-card border border-sand p-8 text-center">
          <p className="text-charcoal/60">No {filter !== "ALL" && filter.toLowerCase()} orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              className={`rounded-card border p-4 transition ${
                order.status === "PENDING"
                  ? "border-yellow-300 bg-yellow-50"
                  : order.status === "READY"
                    ? "border-green-300 bg-green-50"
                    : "border-sand bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-charcoal">
                    {order.orderNumber} — {order.customerName}
                  </h3>
                  <p className="mt-1 text-sm text-charcoal/70">
                    📱 {order.phone} • 📍 {order.meetingLocation}
                  </p>
                  <p className="mt-1 text-sm text-charcoal/70">
                    📅 {order.date} at {order.time} • Rs. {order.total}
                  </p>

                  {/* Items */}
                  <div className="mt-2 text-xs text-charcoal/60">
                    <p>Items: {order.items.map((i) => `${i.bouquetId} (×${i.quantity})`).join(", ")}</p>
                  </div>

                  {/* Notes */}
                  {(order.customizationNote || order.personalMessage) && (
                    <div className="mt-2 rounded bg-charcoal/5 p-2 text-xs">
                      {order.customizationNote && <p>📝 {order.customizationNote}</p>}
                      {order.personalMessage && <p>💬 "{order.personalMessage}"</p>}
                    </div>
                  )}

                  {order.urgent && <p className="mt-2 text-xs font-bold text-red-600">🚨 URGENT ORDER</p>}
                </div>

                {/* Status Control */}
                <div className="flex flex-col gap-2">
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                    className="rounded-md border border-sand bg-white px-3 py-2 text-sm font-medium text-charcoal"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PREPARING">Preparing</option>
                    <option value="READY">Ready</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancel</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-sand bg-blue-50 p-4">
          <p className="text-sm font-medium text-charcoal/60">Total Orders</p>
          <p className="mt-2 text-2xl font-bold text-blue-600">{orders.length}</p>
        </div>
        <div className="rounded-card border border-sand bg-yellow-50 p-4">
          <p className="text-sm font-medium text-charcoal/60">Pending</p>
          <p className="mt-2 text-2xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
        <div className="rounded-card border border-sand bg-green-50 p-4">
          <p className="text-sm font-medium text-charcoal/60">Ready for Pickup</p>
          <p className="mt-2 text-2xl font-bold text-green-600">{readyCount}</p>
        </div>
      </div>
    </div>
  );
}
