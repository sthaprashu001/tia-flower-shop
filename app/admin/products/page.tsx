"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

/**
 * Admin product management.
 *
 * Lets you add, edit, and delete bouquets with an image upload — no code
 * edits or redeploys needed. Requires MONGODB_URI (Phase 2) to actually
 * save anything; until then /api/products serves the read-only mock data
 * in lib/data.ts and this page will tell you so.
 *
 * Auth is a real session (Phase 3, next-auth) — middleware.ts blocks
 * this route for anyone not logged in, and every write API call below
 * relies on the session cookie sent automatically with same-origin
 * requests, no key needed.
 */

interface AdminProduct {
  _id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  available: boolean;
  customizable: boolean;
  cost?: number;
}

const emptyForm = {
  name: "",
  price: "",
  description: "",
  image: "",
  available: true,
  customizable: false,
  cost: "",
};

export default function AdminProductsPage() {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [source, setSource] = useState<"mock" | "database" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    // Middleware already blocks unauthenticated requests to this route,
    // this is just for a clean loading/redirect state client-side.
    if (authStatus === "unauthenticated") {
      router.push("/admin/login");
      return;
    }
    if (authStatus === "authenticated") loadProducts();
  }, [authStatus, router]);

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data.products || []);
      setSource(data.source || null);
    } catch {
      setError("Could not load products.");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(p: AdminProduct) {
    setEditingId(p._id);
    setForm({
      name: p.name,
      price: String(p.price),
      description: p.description,
      image: p.image,
      available: p.available,
      customizable: p.customizable,
      cost: p.cost ? String(p.cost) : "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setFormError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      setForm((f) => ({ ...f, image: data.url }));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) return setFormError("Name is required.");
    const price = Number(form.price);
    if (!price || price <= 0) return setFormError("Enter a valid price.");

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      price,
      description: form.description.trim(),
      image: form.image,
      available: form.available,
      customizable: form.customizable,
      cost: form.cost ? Number(form.cost) : 0,
    };

    try {
      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save product.");

      cancelEdit();
      loadProducts();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save product.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this bouquet? This can't be undone.")) return;

    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      loadProducts();
    } else {
      alert("Could not delete product.");
    }
  }

  const dbNotConnected = source === "mock";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl italic text-charcoal">Manage bouquets</h1>
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="text-sm text-charcoal/60 hover:text-rose-dark"
        >
          ← Back to dashboard
        </button>
      </div>

      {dbNotConnected && (
        <div className="mt-4 rounded-card border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Database not connected.</strong> The catalog below is
          read-only mock data from <code>lib/data.ts</code>. Set{" "}
          <code>MONGODB_URI</code> in your environment variables to add,
          edit, or delete bouquets from here.
        </div>
      )}

      {/* Add / edit form */}
      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-card border border-sand bg-white p-6"
      >
        <h2 className="font-display text-xl italic text-charcoal">
          {editingId ? "Edit bouquet" : "Add a new bouquet"}
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-md border border-sand px-3 py-2"
              placeholder="e.g. Sunflower Bunch"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
              Price (Rs.)
            </label>
            <input
              type="number"
              min={1}
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className="mt-1 w-full rounded-md border border-sand px-3 py-2"
              placeholder="950"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1 w-full rounded-md border border-sand px-3 py-2"
              rows={2}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
              Photo
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="mt-1 w-full text-sm"
            />
            {uploading && <p className="mt-1 text-sm text-charcoal/60">Uploading…</p>}
            {form.image && !uploading && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.image}
                alt="Preview"
                className="mt-2 h-24 w-24 rounded-md border border-sand object-cover"
              />
            )}
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
              Cost (optional, admin-only)
            </label>
            <input
              type="number"
              min={0}
              value={form.cost}
              onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
              className="mt-1 w-full rounded-md border border-sand px-3 py-2"
              placeholder="Never shown to customers"
            />
          </div>

          <div className="flex items-center gap-4 pt-6">
            <label className="flex items-center gap-2 text-sm text-charcoal">
              <input
                type="checkbox"
                checked={form.available}
                onChange={(e) => setForm((f) => ({ ...f, available: e.target.checked }))}
              />
              Available
            </label>
            <label className="flex items-center gap-2 text-sm text-charcoal">
              <input
                type="checkbox"
                checked={form.customizable}
                onChange={(e) => setForm((f) => ({ ...f, customizable: e.target.checked }))}
              />
              Customizable
            </label>
          </div>
        </div>

        {formError && <p className="mt-3 text-sm text-rose-dark">{formError}</p>}

        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            disabled={saving || uploading || dbNotConnected}
            className="rounded-full bg-charcoal px-6 py-2.5 text-sm font-semibold text-ivory hover:bg-charcoal/80 disabled:opacity-60"
          >
            {saving ? "Saving…" : editingId ? "Save changes" : "Add bouquet"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-full border border-sand px-6 py-2.5 text-sm font-semibold text-charcoal hover:bg-sand/40"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Existing products */}
      <div className="mt-8">
        <h2 className="font-display text-xl italic text-charcoal">Current catalog</h2>

        {loading && <p className="mt-4 text-sm text-charcoal/60">Loading…</p>}
        {error && <p className="mt-4 text-sm text-rose-dark">{error}</p>}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {products.map((p) => (
            <div
              key={p._id}
              className="flex gap-3 rounded-card border border-sand bg-white p-4"
            >
              {p.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-16 w-16 flex-shrink-0 rounded-md object-cover"
                />
              )}
              <div className="flex-1">
                <p className="font-semibold text-charcoal">{p.name}</p>
                <p className="text-sm text-charcoal/60">Rs. {p.price.toLocaleString("en-IN")}</p>
                <p className="text-xs text-charcoal/50">
                  {p.available ? "Available" : "Unavailable"}
                  {p.customizable ? " · Customizable" : ""}
                </p>
                {!dbNotConnected && (
                  <div className="mt-2 flex gap-3 text-sm">
                    <button onClick={() => startEdit(p)} className="text-rose-dark hover:underline">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(p._id)} className="text-charcoal/60 hover:text-rose-dark hover:underline">
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
