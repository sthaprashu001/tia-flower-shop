"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * PHASE 1 placeholder login.
 *
 * This checks the entered key against /api/orders directly and stores it
 * in sessionStorage if it works — it is NOT real authentication (no
 * hashed passwords, no sessions, no per-user accounts).
 *
 * Before giving this dashboard link to your sister or other staff,
 * replace this with NextAuth.js (email/password or magic link) — see
 * docs/NEXT_STEPS.md, Phase 3.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setError(null);

    const res = await fetch(`/api/orders?key=${encodeURIComponent(key)}`);
    if (res.ok) {
      sessionStorage.setItem("adminKey", key);
      router.push("/admin/dashboard");
    } else {
      setError("Incorrect key. Check ADMIN_API_KEY in your .env.local.");
    }
    setChecking(false);
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm items-center px-4">
      <form onSubmit={handleSubmit} className="w-full rounded-card border border-sand bg-white p-6">
        <h1 className="font-display text-2xl italic text-charcoal">Admin access</h1>
        <p className="mt-1 text-sm text-charcoal/60">
          Enter the admin key set in your environment variables.
        </p>

        <input
          type="password"
          required
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Admin key"
          className="mt-4 w-full rounded-md border border-sand px-3 py-2"
        />

        {error && <p className="mt-2 text-sm text-rose-dark">{error}</p>}

        <button
          type="submit"
          disabled={checking}
          className="mt-4 w-full rounded-full bg-charcoal px-6 py-2.5 text-sm font-semibold text-ivory hover:bg-charcoal/80 disabled:opacity-60"
        >
          {checking ? "Checking..." : "Enter dashboard"}
        </button>
      </form>
    </div>
  );
}
