"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Order {
  _id: string;
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  items: Array<{ bouquetId: string; quantity: number }>;
  date: string;
  time: string;
  meetingLocation: string;
  customizationNote?: string;
  urgent: boolean;
  total: number;
  status: "DELIVERED" | "CANCELLED" | "REJECTED";
  createdAt?: string;
}

export default function AdminCompletedOrdersPage() {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("DELIVERED");

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/admin/login");
      return;
    }

    loadCompletedOrders();
  }, [authStatus, router]);

  async function loadCompletedOrders() {
    try {
      const res = await fetch("/api/orders/completed");
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Failed to load completed orders:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredOrders = orders.filter(
    (o) => filter === "ALL" || o.status === filter
  );
  const deliveredCount = orders.filter((o) => o.status === "DELIVERED").length;
  const cancelledCount = orders.filter((o) => o.status === "CANCELLED").length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-emerald-50 border-emerald-300";
      case "CANCELLED":
        return "bg-orange-50 border-orange-300";
      case "REJECTED":
        return "bg-red-50 border-red-300";
      default:
        return "bg-white border-sand";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-emerald-100 text-emerald-800";
      case "CANCELLED":
        return "bg-orange-100 text-orange-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-sand text-charcoal";
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl italic text-charcoal">
            Order Archive
          </h1>
          <p className="mt-2 text-sm text-charcoal/70">
            {deliveredCount} delivered • {cancelledCount} cancelled/rejected
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/orders")}
          className="text-sm text-charcoal/60 hover:text-rose-dark"
        >
          ← Back to active orders
        </button>
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {["DELIVERED", "CANCELLED", "REJECTED", "ALL"].map((status) => (
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
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="rounded-card border border-sand p-8 text-center">
          <p className="text-charcoal/60">Loading completed orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-card border border-sand p-8 text-center">
          <p className="text-charcoal/60">
            No {filter !== "ALL" && filter.toLowerCase()} orders yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              className={`rounded-card border p-4 transition ${getStatusColor(
                order.status
              )}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-charcoal">
                      {order.orderNumber}
                    </h3>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusBadgeColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <p className="text-sm text-charcoal/70">
                    {order.customerName} • {order.phone}
                  </p>
                  <p className="mt-1 text-sm text-charcoal/70">
                    📅 {order.date} at {order.time} • 📍 {order.meetingLocation}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-charcoal">
                    Rs. {order.total}
                  </p>

                  {/* Items */}
                  <div className="mt-2 text-xs text-charcoal/60">
                    <p>
                      Items: {order.items.map((i) => `${i.bouquetId} (×${i.quantity})`).join(", ")}
                    </p>
                  </div>

                  {/* Order Date */}
                  {order.createdAt && (
                    <p className="mt-2 text-xs text-charcoal/50">
                      Placed: {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-sand bg-emerald-50 p-4">
          <p className="text-sm font-medium text-charcoal/60">Delivered</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {deliveredCount}
          </p>
        </div>
        <div className="rounded-card border border-sand bg-orange-50 p-4">
          <p className="text-sm font-medium text-charcoal/60">Cancelled</p>
          <p className="mt-2 text-2xl font-bold text-orange-600">
            {orders.filter((o) => o.status === "CANCELLED").length}
          </p>
        </div>
        <div className="rounded-card border border-sand bg-red-50 p-4">
          <p className="text-sm font-medium text-charcoal/60">Rejected</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {orders.filter((o) => o.status === "REJECTED").length}
          </p>
        </div>
      </div>
    </div>
  );
}
