"use client";

import { useState } from "react";
import Link from "next/link";

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  date: string;
  time: string;
  meetingLocation: string;
  total: number;
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED" | "REJECTED";
  createdAt: string;
  items: Array<{ bouquetId: string; quantity: number }>;
  customizationNote?: string;
  urgent: boolean;
}

const statusSteps = ["PENDING", "CONFIRMED", "PREPARING", "READY", "DELIVERED"];

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PREPARING: "bg-purple-100 text-purple-800",
  READY: "bg-green-100 text-green-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
  REJECTED: "bg-red-100 text-red-800",
};

const statusMessages: Record<string, string> = {
  PENDING: "Order received - waiting for confirmation",
  CONFIRMED: "Order confirmed - we're preparing your flowers",
  PREPARING: "We're arranging your beautiful bouquet",
  READY: "✅ Your order is ready for pickup!",
  DELIVERED: "✅ Order completed - thank you!",
  CANCELLED: "Order was cancelled",
  REJECTED: "Order was rejected",
};

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleTrack() {
    if (!orderNumber.trim() || !phone.trim()) {
      setError("Please enter order number and phone");
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const res = await fetch(
        `/api/orders/track?orderNumber=${encodeURIComponent(orderNumber)}&phone=${encodeURIComponent(phone)}`
      );

      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
      } else if (res.status === 404) {
        setError("Order not found. Check your order number and phone.");
      } else {
        setError("Failed to find order. Please try again.");
      }
    } catch (err) {
      setError("Error searching for order. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const currentStatusIndex = order
    ? statusSteps.indexOf(order.status as any)
    : -1;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl italic text-charcoal">Track Your Order</h1>
        <p className="mt-2 text-sm text-charcoal/70">
          Enter your order number and phone to see the status
        </p>
      </div>

      {/* Search Form */}
      <div className="rounded-card border border-sand bg-sand/30 p-6 mb-8">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-charcoal/70">Order Number</label>
            <input
              type="text"
              placeholder="e.g., ORD-123456-ABC"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleTrack()}
              className="mt-2 w-full rounded-md border border-sand px-4 py-2 placeholder:text-charcoal/30"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-charcoal/70">Phone Number</label>
            <input
              type="text"
              placeholder="e.g., 9841234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTrack()}
              className="mt-2 w-full rounded-md border border-sand px-4 py-2 placeholder:text-charcoal/30"
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={handleTrack}
            disabled={loading}
            className="w-full rounded-full bg-rose py-3 font-semibold text-white hover:bg-rose-dark disabled:opacity-50"
          >
            {loading ? "Searching..." : "Track Order"}
          </button>
        </div>
      </div>

      {/* Order Details */}
      {order && (
        <div className="space-y-6">
          {/* Status Badge */}
          <div className="text-center">
            <span className={`inline-block rounded-full px-4 py-2 font-semibold ${statusColors[order.status]}`}>
              {order.status}
            </span>
            <p className="mt-3 text-sm text-charcoal/70">{statusMessages[order.status]}</p>
          </div>

          {/* Progress Bar */}
          <div className="rounded-card border border-sand bg-white p-6">
            <div className="space-y-4">
              {statusSteps.map((step, idx) => {
                const isCompleted = idx <= currentStatusIndex;
                const isCurrent = idx === currentStatusIndex;

                return (
                  <div key={step} className="flex items-center gap-4">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center font-bold transition ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : "bg-sand text-charcoal/50"
                      }`}
                    >
                      {isCompleted ? "✓" : idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${isCompleted ? "text-charcoal" : "text-charcoal/50"}`}>
                        {step}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-rose-dark">Currently at this stage</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Info */}
          <div className="rounded-card border border-sand bg-white p-6">
            <h3 className="font-semibold text-charcoal mb-4">Order Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-charcoal/70">Order Number:</span>
                <span className="font-semibold text-charcoal">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal/70">Pickup Date:</span>
                <span className="font-semibold text-charcoal">{order.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal/70">Pickup Time:</span>
                <span className="font-semibold text-charcoal">{order.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal/70">Pickup Location:</span>
                <span className="font-semibold text-charcoal">{order.meetingLocation}</span>
              </div>
              <div className="flex justify-between border-t border-sand pt-3">
                <span className="text-charcoal/70">Total Amount:</span>
                <span className="font-semibold text-rose-dark">Rs. {order.total}</span>
              </div>
            </div>

            {order.customizationNote && (
              <div className="mt-4 rounded-md bg-sand/20 p-3 text-xs">
                <p className="font-semibold text-charcoal/70">Customization:</p>
                <p className="text-charcoal">{order.customizationNote}</p>
              </div>
            )}
          </div>

          {/* CTA */}
          {order.status === "READY" && (
            <div className="rounded-card border border-green-300 bg-green-50 p-4 text-center">
              <p className="font-semibold text-green-800">Your order is ready! 🎉</p>
              <p className="mt-1 text-sm text-green-700">
                Come pick it up at {order.meetingLocation} at {order.time}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Help */}
      {!order && !loading && !error && (
        <div className="rounded-card border border-sand bg-sand/10 p-6 text-center">
          <p className="text-charcoal/70">
            Don't have your order number? Check your confirmation email or SMS.
          </p>
          <p className="mt-2 text-sm text-charcoal/60">
            Need help?{" "}
            <Link href="/contact" className="font-semibold text-rose-dark hover:underline">
              Contact us
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
