"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PasswordInput from "@/components/PasswordInput";
import { useSession, signOut } from "next-auth/react";
import { Order, OrderStatus, Bouquet, ShopStatus } from "@/lib/types";
import AdminOrderCard from "@/components/admin/AdminOrderCard";
import { useOrderAlerts } from "@/components/admin/useOrderAlerts";

const POLL_MS = 30_000; // how often the order list refreshes by itself

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

  // Order status saving (per-order, keyed by order id)
  const [savingStatus, setSavingStatus] = useState<Record<string, boolean>>({});
  const [statusError, setStatusError] = useState<Record<string, string>>({});

  // Live shop settings (status + hourly capacity)
  const [shopStatus, setShopStatus] = useState<ShopStatus>("OPEN");
  const [capacityPerHour, setCapacityPerHour] = useState<number>(8);
  const [capacityInput, setCapacityInput] = useState("8");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [openInput, setOpenInput] = useState("6");
  const [closeInput, setCloseInput] = useState("22");

  // Change my own password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMessage, setPwMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  const { soundOn, toggleSound } = useOrderAlerts(orders, !loading);

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

    refreshOrders(true);

    fetch("/api/shop-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.status) setShopStatus(data.status);
        if (data.capacityPerHour) {
          setCapacityPerHour(data.capacityPerHour);
          setCapacityInput(String(data.capacityPerHour));
        }
        if (typeof data.openHour === "number") setOpenInput(String(data.openHour));
        if (typeof data.closeHour === "number") setCloseInput(String(data.closeHour));
      })
      .catch(() => {
        // Non-critical — falls back to defaults already in state.
      });
  }, [authStatus, router]);

  // Fetch the order list. The first call shows the loading state and any error;
  // the automatic refreshes after that stay quiet so the screen doesn't flicker.
  function refreshOrders(first = false) {
    return fetch("/api/orders")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setOrders(data.orders || []);
        setError(null);
      })
      .catch(() => {
        if (first) setError("Could not load orders.");
      })
      .finally(() => {
        if (first) setLoading(false);
      });
  }

  // Keep the list fresh while this tab is open so new orders show up without a reload.
  useEffect(() => {
    if (authStatus !== "authenticated") return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refreshOrders();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [authStatus]);

  async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    setSavingStatus((s) => ({ ...s, [orderId]: true }));
    setStatusError((e) => ({ ...e, [orderId]: "" }));

    const previous = orders.find((o) => o.id === orderId)?.status;
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Could not save status.");
    } catch {
      // Roll back on failure
      setOrders((prev) => prev.map((o) => (o.id === orderId && previous ? { ...o, status: previous } : o)));
      setStatusError((e) => ({ ...e, [orderId]: "Could not save — try again." }));
    } finally {
      setSavingStatus((s) => ({ ...s, [orderId]: false }));
    }
  }

  async function handleDeleteOrder(orderId: string) {
    if (!confirm("Remove this order permanently? This can't be undone.")) return;

    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch {
      alert("Could not remove order — try again.");
    }
  }

  async function handleSetShopStatus(newStatus: ShopStatus) {
    setSettingsSaving(true);
    setSettingsError(null);
    const previous = shopStatus;
    setShopStatus(newStatus);

    try {
      const res = await fetch("/api/shop-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update status.");
    } catch (err) {
      setShopStatus(previous);
      setSettingsError(err instanceof Error ? err.message : "Could not update status.");
    } finally {
      setSettingsSaving(false);
    }
  }

  async function handleSetCapacity(e: React.FormEvent) {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsError(null);

    try {
      const res = await fetch("/api/shop-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capacityPerHour: Number(capacityInput) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update capacity.");
      setCapacityPerHour(data.capacityPerHour);
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : "Could not update capacity.");
    } finally {
      setSettingsSaving(false);
    }
  }

  async function handleSetHours(e: React.FormEvent) {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsError(null);
    try {
      const res = await fetch("/api/shop-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openHour: Number(openInput), closeHour: Number(closeInput) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update hours.");
      setOpenInput(String(data.openHour));
      setCloseInput(String(data.closeHour));
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : "Could not update hours.");
    } finally {
      setSettingsSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwSaving(true);
    setPwMessage(null);
    try {
      const res = await fetch("/api/admins/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not change password.");
      setPwMessage({ ok: true, text: "Password changed. Use the new one next time you log in." });
      setCurrentPw("");
      setNewPw("");
    } catch (err) {
      setPwMessage({ ok: false, text: err instanceof Error ? err.message : "Could not change password." });
    } finally {
      setPwSaving(false);
    }
  }

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl italic text-charcoal sm:text-3xl">Admin dashboard</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {authSession?.user?.email && (
            <span className="min-w-0 truncate text-sm text-charcoal/50">{authSession.user.email}</span>
          )}
          <button
            onClick={() => router.push("/admin/orders")}
            className="whitespace-nowrap text-sm font-semibold text-rose-dark hover:underline"
          >
            Manage orders →
          </button>
          <button
            onClick={() => router.push("/admin/products")}
            className="whitespace-nowrap text-sm font-semibold text-rose-dark hover:underline"
          >
            Manage bouquets →
          </button>
          <button
            onClick={() => router.push("/admin/admins")}
            className="whitespace-nowrap text-sm font-semibold text-rose-dark hover:underline"
          >
            Manage admins →
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="whitespace-nowrap text-sm text-charcoal/60 hover:text-rose-dark"
          >
            Log out
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-card border border-sand bg-white p-5">
        <h2 className="font-display text-lg italic text-charcoal">Shop settings</h2>
        <p className="mt-1 text-sm text-charcoal/60">
          Changes here apply immediately on the live site — no redeploy needed.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-charcoal">Status:</span>
          {(["OPEN", "BUSY", "CLOSED"] as ShopStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => handleSetShopStatus(s)}
              disabled={settingsSaving}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition disabled:opacity-60 ${
                shopStatus === s
                  ? "bg-charcoal text-ivory"
                  : "border border-sand text-charcoal hover:border-rose"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <form onSubmit={handleSetCapacity} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-charcoal/60">
              Max orders per hour
            </label>
            <input
              type="number"
              min={1}
              value={capacityInput}
              onChange={(e) => setCapacityInput(e.target.value)}
              className="mt-1 w-24 rounded-md border border-sand px-3 py-1.5"
            />
          </div>
          <button
            type="submit"
            disabled={settingsSaving}
            className="rounded-full border border-sand px-4 py-1.5 text-sm font-semibold text-charcoal hover:border-rose disabled:opacity-60"
          >
            Save
          </button>
          <span className="text-xs text-charcoal/50">Currently {capacityPerHour}/hour</span>
        </form>

        <form onSubmit={handleSetHours} className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-charcoal/60">
              Pickups from (hour, 0–23)
            </label>
            <input
              type="number"
              min={0}
              max={23}
              value={openInput}
              onChange={(e) => setOpenInput(e.target.value)}
              className="mt-1 w-24 rounded-md border border-sand px-3 py-1.5"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-charcoal/60">
              Until (hour, 1–24)
            </label>
            <input
              type="number"
              min={1}
              max={24}
              value={closeInput}
              onChange={(e) => setCloseInput(e.target.value)}
              className="mt-1 w-24 rounded-md border border-sand px-3 py-1.5"
            />
          </div>
          <button
            type="submit"
            disabled={settingsSaving}
            className="rounded-full border border-sand px-4 py-1.5 text-sm font-semibold text-charcoal hover:border-rose disabled:opacity-60"
          >
            Save hours
          </button>
          <span className="text-xs text-charcoal/50">
            Customers can only pick pickup times inside these hours (Kathmandu time).
          </span>
        </form>

        {settingsError && <p className="mt-3 text-sm text-rose-dark">{settingsError}</p>}
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl italic text-charcoal">Orders</h2>
          <button
            onClick={toggleSound}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              soundOn ? "border-sage bg-sage-light text-sage-dark" : "border-sand text-charcoal/70 hover:border-rose"
            }`}
          >
            {soundOn ? "🔔 New-order sound: on" : "🔕 New-order sound: off"}
          </button>
        </div>
        <p className="mt-1 text-xs text-charcoal/50">
          This list refreshes by itself every 30 seconds. Turn sound on once to hear a chime when a new order arrives.
        </p>

        {loading && <p className="mt-4 text-sm text-charcoal/60">Loading...</p>}
        {error && <p className="mt-4 text-sm text-rose-dark">{error}</p>}

        {!loading && !error && orders.length === 0 && (
          <p className="mt-4 text-sm text-charcoal/60">No orders yet.</p>
        )}

        <div className="mt-4 space-y-3">
          {orders.map((order) => (
            <AdminOrderCard
              key={order.id}
              order={order}
              nameLookup={bouquetNames}
              saving={savingStatus[order.id]}
              error={statusError[order.id]}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteOrder}
            />
          ))}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-xl italic text-charcoal">Your account</h2>
        <p className="mt-1 text-sm text-charcoal/60">
          Change your own password. (If you forget it, the super admin can set a new one from Manage admins.)
        </p>
        <form onSubmit={handleChangePassword} className="mt-4 rounded-card border border-sand bg-white p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">Current password</label>
              <PasswordInput value={currentPw} onChange={setCurrentPw} required autoComplete="current-password" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">New password</label>
              <PasswordInput value={newPw} onChange={setNewPw} required minLength={8} autoComplete="new-password" />
            </div>
          </div>
          {pwMessage && (
            <p className={`mt-3 text-sm ${pwMessage.ok ? "text-green-700" : "text-rose-dark"}`}>{pwMessage.text}</p>
          )}
          <button
            type="submit"
            disabled={pwSaving}
            className="mt-4 rounded-full bg-charcoal px-6 py-2.5 text-sm font-semibold text-ivory hover:bg-charcoal/80 disabled:opacity-60"
          >
            {pwSaving ? "Saving…" : "Change password"}
          </button>
        </form>
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
              <PasswordInput value={staffPassword} onChange={setStaffPassword} required minLength={8} autoComplete="new-password" />
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
