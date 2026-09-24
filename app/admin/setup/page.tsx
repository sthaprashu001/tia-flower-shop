"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PasswordInput from "@/components/PasswordInput";

/**
 * Visit this once, right after your first deploy with MONGODB_URI
 * connected, to create your own admin login. It refuses to run again
 * once any account exists — safe to leave in the codebase permanently.
 *
 * Do this immediately after deploying, before sharing any link to your
 * site — there's a short window where anyone who finds this page first
 * could create the account instead of you.
 */
export default function AdminSetupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [alreadySetUp, setAlreadySetUp] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [setupToken, setSetupToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/setup")
      .then((res) => res.json())
      .then((data) => setAlreadySetUp(Boolean(data.setupComplete)))
      .catch(() => setError("Could not check setup status."))
      .finally(() => setChecking(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) return setError("Passwords don't match.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, setupToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create account.");
      router.push("/admin/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account.");
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return <div className="mx-auto max-w-sm px-4 py-20 text-center text-charcoal/60">Checking…</div>;
  }

  if (alreadySetUp) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-sm items-center px-4">
        <div className="w-full rounded-card border border-sand bg-white p-6 text-center">
          <h1 className="font-display text-2xl italic text-charcoal">Already set up</h1>
          <p className="mt-2 text-sm text-charcoal/60">
            An admin account already exists. If you need to add another
            person, log in and add them from the dashboard.
          </p>
          <button
            onClick={() => router.push("/admin/login")}
            className="mt-4 w-full rounded-full bg-charcoal px-6 py-2.5 text-sm font-semibold text-ivory hover:bg-charcoal/80"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm items-center px-4">
      <form onSubmit={handleSubmit} className="w-full rounded-card border border-sand bg-white p-6">
        <h1 className="font-display text-2xl italic text-charcoal">Create your admin account</h1>
        <p className="mt-1 text-sm text-charcoal/60">
          This runs once. Use a real password — this account can edit your
          catalog and see all orders.
        </p>

        <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-charcoal/60">
          Setup token
        </label>
        <input
          type="password"
          autoComplete="off"
          value={setupToken}
          onChange={(e) => setSetupToken(e.target.value)}
          placeholder="The SETUP_TOKEN value from your environment"
          className="mt-1 w-full rounded-md border border-sand px-3 py-2"
        />

        <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-charcoal/60">
          Your name (optional)
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-sand px-3 py-2"
        />

        <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-charcoal/60">
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
        <PasswordInput value={password} onChange={setPassword} required minLength={8} autoComplete="new-password" />

        <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-charcoal/60">
          Confirm password
        </label>
        <PasswordInput value={confirm} onChange={setConfirm} required autoComplete="new-password" />

        {error && <p className="mt-3 text-sm text-rose-dark">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-4 w-full rounded-full bg-charcoal px-6 py-2.5 text-sm font-semibold text-ivory hover:bg-charcoal/80 disabled:opacity-60"
        >
          {submitting ? "Creating…" : "Create account"}
        </button>
      </form>
    </div>
  );
}
