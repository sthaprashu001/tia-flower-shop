"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LEAD_TIME_PRESETS, leadTimeLabel } from "@/lib/time";

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
  category?: string;
  featured?: boolean;
  featuredOrder?: number;
  leadTimeHours?: number;
  todayPick?: boolean;
}

/**
 * Shrinks a big phone photo before uploading (max 1600px, JPEG). Faster to
 * upload, faster for customers to load, and keeps it under the upload limit.
 * If anything goes wrong the original file is used unchanged.
 */
async function shrinkImage(file: File): Promise<File> {
  try {
    if (file.size < 300 * 1024) return file;
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#ffffff"; // PNGs with transparency get a white background
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

const PRESET_HOURS = LEAD_TIME_PRESETS.map((p) => p.hours);

const emptyForm = {
  name: "",
  price: "",
  description: "",
  image: "",
  available: true,
  customizable: false,
  cost: "",
  category: "Bouquets",
  featured: false,
  featuredOrder: 0,
  leadTimeHours: "0", // minimum notice in hours; "0" = none
  todayPick: false,
};

export default function AdminProductsPage() {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [source, setSource] = useState<"mock" | "database" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [customLead, setCustomLead] = useState(false);
  const [toggling, setToggling] = useState<Record<string, boolean>>({});
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

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
      const [productsRes, categoriesRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
      ]);
      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();
      setProducts(productsData.products || []);
      setCategories(categoriesData.categories || ["Bouquets"]);
      setSource(productsData.source || null);
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
      category: p.category || "Bouquets",
      featured: p.featured ?? false,
      featuredOrder: p.featuredOrder ?? 0,
      leadTimeHours: String(p.leadTimeHours ?? 0),
      todayPick: p.todayPick ?? false,
    });
    setCustomLead(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setCustomLead(false);
    setFormError(null);
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setFormError(null);
    try {
      const body = new FormData();
      body.append("file", await shrinkImage(file));
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

    const leadHours = Number(form.leadTimeHours);
    if (!Number.isInteger(leadHours) || leadHours < 0 || leadHours > 720) {
      return setFormError("Order-before time must be a whole number of hours (0–720).");
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      price,
      description: form.description.trim(),
      image: form.image,
      available: form.available,
      customizable: form.customizable,
      cost: form.cost ? Number(form.cost) : 0,
      category: form.category.trim() || "Bouquets",
      featured: form.featuredOrder > 0,
      featuredOrder: form.featuredOrder,
      leadTimeHours: leadHours,
      todayPick: form.todayPick,
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

  // One-tap availability switch. The shop pages read the database on every visit,
  // so the change shows on the catalog straight away — no redeploy.
  async function handleToggleAvailable(p: AdminProduct) {
    const next = !p.available;
    setToggling((t) => ({ ...t, [p._id]: true }));
    setProducts((prev) => prev.map((x) => (x._id === p._id ? { ...x, available: next } : x)));
    try {
      const res = await fetch(`/api/products/${p._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setProducts((prev) => prev.map((x) => (x._id === p._id ? { ...x, available: !next } : x)));
      alert("Could not change availability — try again.");
    } finally {
      setToggling((t) => ({ ...t, [p._id]: false }));
    }
  }

  // One-tap "Today's pick" switch — shown in the homepage "Today's items"
  // section for any category (see app/page.tsx), takes effect immediately.
  async function handleToggleTodayPick(p: AdminProduct) {
    const next = !p.todayPick;
    setToggling((t) => ({ ...t, [`pick-${p._id}`]: true }));
    setProducts((prev) => prev.map((x) => (x._id === p._id ? { ...x, todayPick: next } : x)));
    try {
      const res = await fetch(`/api/products/${p._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todayPick: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setProducts((prev) => prev.map((x) => (x._id === p._id ? { ...x, todayPick: !next } : x)));
      alert("Could not change Today's pick — try again.");
    } finally {
      setToggling((t) => ({ ...t, [`pick-${p._id}`]: false }));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product? This can't be undone.")) return;

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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl italic text-charcoal sm:text-3xl">Manage products</h1>
          <p className="mt-1 text-sm text-charcoal/70">Add and manage bouquets, khata, flags, and more.</p>
        </div>
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="self-start text-sm text-charcoal/60 hover:text-rose-dark"
        >
          ← Back to dashboard
        </button>
      </div>

      {dbNotConnected && (
        <div className="mt-4 rounded-card border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Database not connected.</strong> The catalog below is
          read-only mock data from <code>lib/data.ts</code>. Set{" "}
          <code>MONGODB_URI</code> in your environment variables to add,
          edit, or delete products from here.
        </div>
      )}

      {/* Add / edit form */}
      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-card border border-sand bg-white p-6"
      >
        <h2 className="font-display text-xl italic text-charcoal">
          {editingId ? "Edit product" : "Add a new product"}
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

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
              Product Type / Category
            </label>
            <input
              type="text"
              list="categoryList"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="mt-1 w-full rounded-md border border-sand px-3 py-2"
              placeholder="e.g. Bouquets, Khata, Flags"
            />
            <datalist id="categoryList">
              {categories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
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

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
              Order before (minimum notice)
            </label>
            <select
              value={customLead || !PRESET_HOURS.includes(Number(form.leadTimeHours)) ? "custom" : form.leadTimeHours}
              onChange={(e) => {
                if (e.target.value === "custom") {
                  setCustomLead(true);
                } else {
                  setCustomLead(false);
                  setForm((f) => ({ ...f, leadTimeHours: e.target.value }));
                }
              }}
              className="mt-1 w-full rounded-md border border-sand bg-white px-3 py-2"
            >
              {LEAD_TIME_PRESETS.map((o) => (
                <option key={o.hours} value={String(o.hours)}>
                  {o.label}
                </option>
              ))}
              <option value="custom">Custom (choose the hours)…</option>
            </select>
            {(customLead || !PRESET_HOURS.includes(Number(form.leadTimeHours))) && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={720}
                  value={form.leadTimeHours}
                  onChange={(e) => setForm((f) => ({ ...f, leadTimeHours: e.target.value }))}
                  className="w-28 rounded-md border border-sand px-3 py-2"
                />
                <span className="text-sm text-charcoal/60">hours before pickup</span>
              </div>
            )}
            <p className="mt-1 text-xs text-charcoal/50">
              {Number(form.leadTimeHours) > 0
                ? `Customers must order at least ${leadTimeLabel(Number(form.leadTimeHours))} before pickup. They see this on the product, in their cart and on the order form, and earlier pickup times are switched off for them.`
                : "No minimum — customers can pick any free pickup time."}
            </p>
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

          <div className="sm:col-span-2 rounded-md border border-sand bg-sand/10 p-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
              Homepage photo stack — position (1–10)
            </label>
            <input
              type="number"
              min={0}
              max={10}
              value={form.featuredOrder}
              onChange={(e) => setForm((f) => ({ ...f, featuredOrder: parseInt(e.target.value) || 0 }))}
              className="mt-1 w-32 rounded-md border border-sand bg-white px-3 py-2"
              placeholder="Blank = hidden"
            />
            <p className="mt-1 text-xs text-charcoal/50">
              This is the pile of tossed photos at the very top of the homepage (above &quot;How ordering
              works&quot;), on both phone and desktop. Set a number 1–10 to include this item — lower numbers
              are placed first. Leave it at 0 to leave this item out. Works for any category (bouquets, khata,
              flags), so you decide the exact mix. If no product has a number set, we show a default mix
              automatically.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-6">
            <label className="flex items-center gap-2 text-sm text-charcoal">
              <input
                type="checkbox"
                checked={form.todayPick}
                onChange={(e) => setForm((f) => ({ ...f, todayPick: e.target.checked }))}
              />
              Show in &quot;Today&apos;s items&quot; grid
            </label>
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
          <p className="mt-1 text-xs text-charcoal/50">
            &quot;Today&apos;s items&quot; is a different section — the grid of bouquets further down the
            homepage. If you don&apos;t pick at least 8 items across all categories, we automatically fill the
            rest so the grid is never half-empty on mobile.
          </p>
        </div>

        {formError && <p className="mt-3 text-sm text-rose-dark">{formError}</p>}

        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            disabled={saving || uploading || dbNotConnected}
            className="rounded-full bg-charcoal px-6 py-2.5 text-sm font-semibold text-ivory hover:bg-charcoal/80 disabled:opacity-60"
          >
            {saving ? "Saving…" : editingId ? "Save changes" : "Add product"}
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
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl italic text-charcoal">Current catalog</h2>
          {!loading && !error && (
            <div className="text-sm text-charcoal/70">
              <span className="font-semibold text-charcoal">{products.length}</span> total product{products.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {loading && <p className="mt-4 text-sm text-charcoal/60">Loading…</p>}
        {error && <p className="mt-4 text-sm text-rose-dark">{error}</p>}

        {!loading && !error && products.length > 0 && (
          <>
            {/* Category breakdown */}
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.map((cat) => {
                const count = products.filter((p) => (p.category || "Bouquets") === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(filterCategory === cat ? "" : cat)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      filterCategory === cat
                        ? "bg-charcoal text-ivory"
                        : "bg-sand/50 text-charcoal hover:bg-sand"
                    }`}
                  >
                    {cat} <span className="ml-1 opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-charcoal/60">
                Search products
              </label>
              <input
                type="text"
                placeholder="e.g. Red Rose, Khata, Flag"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-1 w-full rounded-md border border-sand px-3 py-2"
              />
            </div>
          </>
        )}

        {(() => {
          const filtered = products.filter((p) => {
            const matchesSearch =
              searchQuery === "" ||
              p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (p.description?.toLowerCase() || "").includes(searchQuery.toLowerCase());
            const matchesCategory = filterCategory === "" || p.category === filterCategory;
            return matchesSearch && matchesCategory;
          });

          if (filtered.length === 0 && !loading && products.length > 0) {
            return (
              <div className="mt-6 rounded-card border border-sand/50 bg-sand/10 p-6 text-center">
                <p className="text-sm text-charcoal/60">No products match your filter.</p>
              </div>
            );
          }

          return (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {filtered.map((p) => (
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
                <div className="mt-1 flex gap-2 items-center">
                  <span className="inline-block rounded-full bg-sage-light px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-sage-dark">
                    {p.category || "Bouquets"}
                  </span>
                  {p.featured && (
                    <span className="inline-block rounded-full bg-rose/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-rose-dark">
                      Homepage stack {p.featuredOrder && `(#${p.featuredOrder})`}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-charcoal/50">
                  {p.customizable ? "Customizable" : ""}
                  {p.customizable && (p.leadTimeHours || 0) > 0 ? " · " : ""}
                  {(p.leadTimeHours || 0) > 0 ? `Order ${leadTimeLabel(p.leadTimeHours || 0)} ahead` : ""}
                </p>
                {!dbNotConnected && (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={p.available}
                    aria-label={`${p.name} available`}
                    disabled={toggling[p._id]}
                    onClick={() => handleToggleAvailable(p)}
                    className="mt-2 flex items-center gap-2 disabled:opacity-60"
                  >
                    <span
                      className={`relative inline-block h-6 w-11 rounded-full transition ${
                        p.available ? "bg-sage" : "bg-charcoal/25"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                          p.available ? "left-[1.375rem]" : "left-0.5"
                        }`}
                      />
                    </span>
                    <span className={`text-xs font-semibold ${p.available ? "text-sage-dark" : "text-charcoal/50"}`}>
                      {p.available ? "Available" : "Sold out"}
                    </span>
                  </button>
                )}
                {!dbNotConnected && (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={p.todayPick ?? false}
                    aria-label={`${p.name} today's pick`}
                    disabled={toggling[`pick-${p._id}`]}
                    onClick={() => handleToggleTodayPick(p)}
                    className="mt-2 flex items-center gap-2 disabled:opacity-60"
                  >
                    <span
                      className={`relative inline-block h-6 w-11 rounded-full transition ${
                        p.todayPick ? "bg-rose" : "bg-charcoal/25"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                          p.todayPick ? "left-[1.375rem]" : "left-0.5"
                        }`}
                      />
                    </span>
                    <span className={`text-xs font-semibold ${p.todayPick ? "text-rose-dark" : "text-charcoal/50"}`}>
                      {p.todayPick ? "Today's pick" : "Not in today's items"}
                    </span>
                  </button>
                )}
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
          );
        })()}
      </div>
    </div>
  );
}
