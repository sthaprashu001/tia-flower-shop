"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Order, OrderStatus, Bouquet } from "@/lib/types";
import AdminOrderCard from "@/components/admin/AdminOrderCard";
import { useOrderAlerts } from "@/components/admin/useOrderAlerts";

const POLL_MS = 30_000; // the list refreshes by itself this often

export default function AdminOrdersPage() {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("PENDING");
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { soundOn, toggleSound } = useOrderAlerts(orders, !loading);

  const loadOrders = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/admin/login");
      return;
    }
    if (authStatus !== "authenticated") return;

    loadOrders();
    // Names for older orders that were saved before item names were stored with them.
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        const map: Record<string, string> = {};
        (data.products || []).forEach((b: Bouquet) => {
          map[b.id] = b.name;
        });
        setNames(map);
      })
      .catch(() => {});

    const id = setInterval(() => {
      if (document.visibilityState === "visible") loadOrders();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [authStatus, router, loadOrders]);

  async function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    setSaving((s) => ({ ...s, [orderId]: true }));
    setErrors((e) => ({ ...e, [orderId]: "" }));
    const previous = orders.find((o) => o.id === orderId)?.status;
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setOrders((prev) => prev.map((o) => (o.id === orderId && previous ? { ...o, status: previous } : o)));
      setErrors((e) => ({ ...e, [orderId]: "Could not save — try again." }));
    } finally {
      setSaving((s) => ({ ...s, [orderId]: false }));
    }
  }

  const filteredOrders = orders.filter((o) => filter === "ALL" || o.status === filter);
  const pendingCount = orders.filter((o) => o.status === "PENDING").length;
  const readyCount = orders.filter((o) => o.status === "READY").length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl italic text-charcoal">Active Orders</h1>
          <p className="mt-2 text-sm text-charcoal/70">
            {pendingCount} pending • {readyCount} ready for pickup
          </p>
          <button
            onClick={toggleSound}
            className={`mt-3 rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              soundOn ? "border-sage bg-sage-light text-sage-dark" : "border-sand text-charcoal/70 hover:border-rose"
            }`}
          >
            {soundOn ? "🔔 New-order sound: on" : "🔕 New-order sound: off"}
          </button>
          <p className="mt-1 text-xs text-charcoal/50">Refreshes by itself every 30 seconds.</p>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => router.push("/admin/completed-orders")}
            className="text-sm text-charcoal/60 hover:text-rose-dark"
          >
            View completed →
          </button>
          <button onClick={() => router.push("/admin/dashboard")} className="text-sm text-charcoal/60 hover:text-rose-dark">
            ← Back to dashboard
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {["PENDING", "CONFIRMED", "PREPARING", "READY", "DELIVERED", "ALL"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === status ? "bg-rose text-white" : "bg-sand text-charcoal hover:bg-sand/70"
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
            <AdminOrderCard
              key={order.id}
              order={order}
              nameLookup={names}
              saving={saving[order.id]}
              error={errors[order.id]}
              onStatusChange={updateOrderStatus}
            />
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
