"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
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
  const { data: authSession, status: authStatus } = useSession();

  const [orders, setOrders] = useState<Order[]>([]);
  const [bouquetNames, setBouquetNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Staff account management
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffError, setStaffError] = useState<string | null>(null);
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffAdded, setStaffAdded] = useState(false);

  useEffect(() => {
    // Middleware already blocks unauthenticated requests to this route,
    // this is just for a clean loading/redirect state client-side.
    if (authStatus === "unauthenticated") {
      router.push("/admin/login");
      return;
    }
    if (authStatus !== "authenticated") return;

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

    fetch("/api/orders")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => setOrders(data.orders || []))
      .catch(() => setError("Could not load orders."))
      .finally(() => setLoading(false));
  }, [authStatus, router]);

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault();
    setStaffError(null);
    setStaffAdded(false);
    setStaffSaving(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: staffName, email: staffEmail, password: staffPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add account.");
      setStaffAdded(true);
      setStaffEmail("");
      setStaffPassword("");
      setStaffName("");
    } catch (err) {
      setStaffError(err instanceof Error ? err.message : "Could not add account.");
    } finally {
      setStaffSaving(false);
    }
  }

  const todayRevenue = orders
    .filter((o) => o.status !== "CANCELLED" && o.status !== "REJECTED")
    .reduce((sum, o) => sum + o.total, 0);

  if (authStatus === "loading") {
    return <div className="mx-auto max-w-5xl px-4 py-20 text-center text-charcoal/60">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl italic text-charcoal">Admin dashboard</h1>
        <div className="flex items-center gap-4">
          {authSession?.user?.email && (
            <span className="text-sm text-charcoal/50">{authSession.user.email}</span>
          )}
          <button
            onClick={() => router.push("/admin/products")}
            className="text-sm font-semibold text-rose-dark hover:underline"
          >
            Manage bouquets →
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="text-sm text-charcoal/60 hover:text-rose-dark"
          >
            Log out
          </button>
        </div>
      </div>

      {/* Note about what's wired up vs. placeholder */}
      <div className="mt-4 rounded-card border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Scaffold note:</strong> Order status changes below are
        display-only for now (no PATCH endpoint yet). See{" "}
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

      <div className="mt-10">
        <h2 className="font-display text-xl italic text-charcoal">Team access</h2>
        <p className="mt-1 text-sm text-charcoal/60">
          Add a login for your sister or other staff — each person gets
          their own email and password instead of sharing one.
        </p>

        <form onSubmit={handleAddStaff} className="mt-4 rounded-card border border-sand bg-white p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
                Name (optional)
              </label>
              <input
                type="text"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                className="mt-1 w-full rounded-md border border-sand px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
                Email
              </label>
              <input
                type="email"
                required
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-sand px-3 py-2"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={staffPassword}
                onChange={(e) => setStaffPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-sand px-3 py-2"
              />
            </div>
          </div>

          {staffError && <p className="mt-3 text-sm text-rose-dark">{staffError}</p>}
          {staffAdded && <p className="mt-3 text-sm text-green-700">Account created — they can log in now.</p>}

          <button
            type="submit"
            disabled={staffSaving}
            className="mt-4 rounded-full bg-charcoal px-6 py-2.5 text-sm font-semibold text-ivory hover:bg-charcoal/80 disabled:opacity-60"
          >
            {staffSaving ? "Adding…" : "Add account"}
          </button>
        </form>
      </div>
    </div>
  );
}
