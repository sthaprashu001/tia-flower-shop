"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Order, OrderStatus, Bouquet } from "@/lib/types";

const STATUS_OPTIONS: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "DELIVERED",
  "CANCELLED",
  "REJECTED",
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [bouquetNames, setBouquetNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = sessionStorage.getItem("adminKey");
    if (!key) {
      router.push("/admin/login");
      return;
    }

    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        const names: Record<string, string> = {};
        (data.products || []).forEach((b: Bouquet) => {
          names[b.id] = b.name;
        });
        setBouquetNames(names);
      })
      .catch(() => {
        // Non-critical — order items will just show their raw id if this fails.
      });

    fetch(`/api/orders?key=${encodeURIComponent(key)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => setOrders(data.orders || []))
      .catch(() => setError("Could not load orders. Try logging in again."))
      .finally(() => setLoading(false));
  }, [router]);

  const todayRevenue = orders
    .filter((o) => o.status !== "CANCELLED" && o.status !== "REJECTED")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl italic text-charcoal">Admin dashboard</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/products")}
            className="text-sm font-semibold text-rose-dark hover:underline"
          >
            Manage bouquets →
          </button>
          <button
            onClick={() => {
              sessionStorage.removeItem("adminKey");
              router.push("/admin/login");
            }}
            className="text-sm text-charcoal/60 hover:text-rose-dark"
          >
            Log out
          </button>
        </div>
      </div>

      {/* Note about what's wired up vs. placeholder */}
      <div className="mt-4 rounded-card border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Scaffold note:</strong> Order status changes below are
        display-only for now (no PATCH endpoint yet). Product management now
        lives under <strong>Manage bouquets</strong> above, but needs{" "}
        <code>MONGODB_URI</code> connected to actually save changes — see{" "}
        <code>docs/NEXT_STEPS.md</code> for what to build next.
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-sand bg-white p-4">
          <p className="font-mono text-xs uppercase tracking-widest text-charcoal/50">Orders</p>
          <p className="mt-1 font-display text-2xl text-charcoal">{orders.length}</p>
        </div>
        <div className="rounded-card border border-sand bg-white p-4">
          <p className="font-mono text-xs uppercase tracking-widest text-charcoal/50">Revenue (active)</p>
          <p className="mt-1 font-display text-2xl text-charcoal">
            Rs. {todayRevenue.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-card border border-sand bg-white p-4">
          <p className="font-mono text-xs uppercase tracking-widest text-charcoal/50">Pending</p>
          <p className="mt-1 font-display text-2xl text-charcoal">
            {orders.filter((o) => o.status === "PENDING").length}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-xl italic text-charcoal">Orders</h2>

        {loading && <p className="mt-4 text-sm text-charcoal/60">Loading...</p>}
        {error && <p className="mt-4 text-sm text-rose-dark">{error}</p>}

        {!loading && !error && orders.length === 0 && (
          <p className="mt-4 text-sm text-charcoal/60">No orders yet.</p>
        )}

        <div className="mt-4 space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-card border border-sand bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-charcoal">
                    #{order.orderNumber} — {order.customerName}
                  </p>
                  <p className="text-sm text-charcoal/60">
                    {order.phone} · {order.date} {order.time} · {order.meetingLocation}
                  </p>
                </div>
                <select
                  defaultValue={order.status}
                  className="rounded-md border border-sand px-2 py-1 text-sm"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <ul className="mt-2 text-sm text-charcoal/70">
                {order.items.map((item) => (
                  <li key={item.bouquetId}>
                    {bouquetNames[item.bouquetId] || item.bouquetId} × {item.quantity}
                  </li>
                ))}
              </ul>

              {order.customizationNote && (
                <p className="mt-1 text-sm italic text-charcoal/60">
                  Customization: {order.customizationNote}
                </p>
              )}
              {order.personalMessage && (
                <p className="mt-1 text-sm italic text-charcoal/60">
                  Message: {order.personalMessage}
                </p>
              )}

              <p className="mt-2 font-mono text-sm font-bold text-rose-dark">
                Rs. {order.total.toLocaleString("en-IN")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
