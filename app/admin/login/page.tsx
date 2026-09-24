"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import PasswordInput from "@/components/PasswordInput";

/**
 * Real admin login (Phase 3) — replaces the old shared ADMIN_API_KEY.
 * Each admin has their own email/password, created via /admin/setup
 * (first account) or the dashboard's "Add staff" section (everyone after).
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.ok) {
      router.push("/admin/dashboard");
    } else {
      setError("Incorrect email or password.");
    }
    setChecking(false);
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm items-center px-4">
      <form onSubmit={handleSubmit} className="w-full rounded-card border border-sand bg-white p-6">
        <h1 className="font-display text-2xl italic text-charcoal">Admin login</h1>
        <p className="mt-1 text-sm text-charcoal/60">
          Sign in with your admin email and password.
        </p>

        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-charcoal/60">
          Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-md border border-sand px-3 py-2"
        />

        <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-charcoal/60">
          Password
        </label>
        <PasswordInput value={password} onChange={setPassword} required autoComplete="current-password" />

        {error && <p className="mt-2 text-sm text-rose-dark">{error}</p>}

        <button
          type="submit"
          disabled={checking}
          className="mt-4 w-full rounded-full bg-charcoal px-6 py-2.5 text-sm font-semibold text-ivory hover:bg-charcoal/80 disabled:opacity-60"
        >
          {checking ? "Signing in..." : "Sign in"}
        </button>

        <p className="mt-4 text-center text-xs text-charcoal/50">
          First time setting this up?{" "}
          <Link href="/admin/setup" className="text-rose-dark hover:underline">
            Create the admin account
          </Link>
        </p>
      </form>
    </div>
  );
}
