"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

export default function OrderStatusPage() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  async function searchOrders(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) {
      setError("Please enter your phone number");
      return;
    }

    setLoading(true);
    setError("");
    setOrders([]);

    try {
      const res = await fetch(`/api/orders?phone=${encodeURIComponent(phone.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setSearched(true);
      } else {
        setError("Could not fetch orders. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const activeOrders = orders.filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED");
  const completedOrders = orders.filter((o) => o.status === "DELIVERED");
  const cancelledOrders = orders.filter((o) => o.status === "CANCELLED");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "PREPARING":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "READY":
        return "bg-green-100 text-green-800 border-green-300";
      case "DELIVERED":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusText = (status: string) => {
    const text: Record<string, string> = {
      PENDING: "⏳ Pending",
      CONFIRMED: "✓ Confirmed",
      PREPARING: "👨‍🍳 Preparing",
      READY: "✓ Ready for Pickup",
      DELIVERED: "✓ Delivered",
      CANCELLED: "✗ Cancelled",
      REJECTED: "✗ Rejected",
    };
    return text[status] || status;
  };

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-sand bg-ivory/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-display text-xl italic text-rose-dark">
            TIA Flower Shop
          </Link>
          <Link href="/" className="text-sm text-charcoal/60 hover:text-rose-dark">
            ← Back to home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl italic text-charcoal">Check Your Order</h1>
          <p className="mt-2 text-charcoal/70">
            Enter your phone number to see your order status
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={searchOrders} className="mb-8 rounded-card border border-sand bg-white p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
            <input
              type="tel"
              placeholder="Your phone number (e.g., 9841234567)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1 rounded-md border border-sand px-4 py-3 text-charcoal placeholder:text-charcoal/40"
            />
            <button
              type="submit"
              disabled={loading}
              className="whitespace-nowrap rounded-full bg-rose px-6 py-3 font-semibold text-white hover:bg-rose-dark disabled:opacity-60"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </form>

        {/* No Results */}
        {searched && orders.length === 0 && (
          <div className="rounded-card border border-sand bg-sand/10 p-8 text-center">
            <p className="text-charcoal/60">No orders found for this phone number.</p>
            <p className="mt-2 text-sm text-charcoal/50">
              If you placed an order, please check the phone number you used.
            </p>
          </div>
        )}

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 font-semibold text-charcoal">Active Orders</h2>
            <div className="space-y-4">
              {activeOrders.map((order) => (
                <div key={order._id} className="rounded-card border border-sand bg-white p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-charcoal">{order.orderNumber}</h3>
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-sm font-medium border ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusText(order.status)}
                        </span>
                      </div>

                      <p className="mt-3 text-sm text-charcoal/70">
                        📅 {order.date} • 🕐 {order.time}
                      </p>
                      <p className="text-sm text-charcoal/70">
                        📍 {order.meetingLocation}
                      </p>

                      {/* Progress Bar */}
                      <div className="mt-4 space-y-2">
                        <ProgressBar status={order.status} />
                      </div>

                      {/* Items */}
                      <div className="mt-4 text-sm text-charcoal/70">
                        <p className="font-medium text-charcoal">Items:</p>
                        <ul className="mt-1 ml-4 list-disc">
                          {order.items.map((item, idx) => (
                            <li key={idx}>
                              Bouquet {item.bouquetId} × {item.quantity}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Notes */}
                      {(order.customizationNote || order.personalMessage) && (
                        <div className="mt-4 rounded bg-sand/20 p-3 text-sm">
                          {order.customizationNote && (
                            <p>
                              <span className="font-medium">Customization:</span>{" "}
                              {order.customizationNote}
                            </p>
                          )}
                          {order.personalMessage && (
                            <p>
                              <span className="font-medium">Message:</span> "{order.personalMessage}"
                            </p>
                          )}
                        </div>
                      )}

                      {order.urgent && (
                        <p className="mt-3 text-sm font-bold text-red-600">🚨 Urgent Order</p>
                      )}
                    </div>

                    {/* Total */}
                    <div className="rounded-card border border-sand bg-sand/10 p-4 text-center sm:whitespace-nowrap">
                      <p className="text-sm text-charcoal/60">Total</p>
                      <p className="mt-1 text-2xl font-bold text-rose-dark">Rs. {order.total}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Orders */}
        {completedOrders.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 font-semibold text-charcoal">Completed Orders</h2>
            <div className="space-y-3">
              {completedOrders.map((order) => (
                <div
                  key={order._id}
                  className="rounded-card border border-emerald-300 bg-emerald-50 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-charcoal">{order.orderNumber}</h3>
                      <p className="text-sm text-charcoal/70">
                        Delivered on {order.date} at {order.time}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-700">✓</p>
                      <p className="text-sm font-medium text-emerald-700">Delivered</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cancelled Orders */}
        {cancelledOrders.length > 0 && (
          <div>
            <h2 className="mb-4 font-semibold text-charcoal">Cancelled Orders</h2>
            <div className="space-y-3">
              {cancelledOrders.map((order) => (
                <div key={order._id} className="rounded-card border border-red-300 bg-red-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-charcoal">{order.orderNumber}</h3>
                      <p className="text-sm text-charcoal/70">{order.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-700">✗</p>
                      <p className="text-sm font-medium text-red-700">Cancelled</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ status }: { status: string }) {
  const steps = ["PENDING", "CONFIRMED", "PREPARING", "READY"];
  const currentIndex = steps.indexOf(status);

  return (
    <div className="space-y-2">
      <div className="flex justify-between gap-2">
        {steps.map((step, idx) => {
          const isCompleted = idx <= currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={step} className="flex-1">
              <div
                className={`h-2 rounded-full transition ${
                  isCompleted ? "bg-emerald-500" : "bg-sand/30"
                }`}
              />
              <p className={`mt-1 text-xs text-center ${isCurrent ? "font-bold text-emerald-600" : "text-charcoal/50"}`}>
                {step}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
