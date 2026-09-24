/**
 * Shared input validation helpers. Every value that comes from a request
 * body / query string is `unknown` until it passes through one of these.
 */

// Trim, drop control characters (keeps \n and \t), and cap the length.
export function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max);
}

export function isObjectId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}

export function isEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

// Accepts things like 9800000000, +977 9800000000, 980-000-0000.
export function isPhone(value: unknown): value is string {
  return typeof value === "string" && /^\+?[0-9][0-9\s-]{5,18}[0-9]$/.test(value.trim());
}

// International format used for WhatsApp notifications, e.g. +9779800000000.
export function isWhatsappNumber(value: unknown): value is string {
  return typeof value === "string" && /^\+[0-9]{8,15}$/.test(value.trim());
}

export function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value);
}

export function isTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function isValidPassword(value: unknown): value is string {
  return typeof value === "string" && value.length >= 8 && value.length <= 128;
}

// Product images must be a local /images/ file or a Vercel Blob URL — never
// an arbitrary URL (or javascript:/data: URI) typed into the admin form.
export function isSafeImageUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (value === "") return true;
  if (value.startsWith("/images/") && !value.includes("..")) return true;
  try {
    const u = new URL(value);
    return u.protocol === "https:" && u.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

function num(value: unknown, min: number, max: number): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max ? value : null;
}

/**
 * Validates bouquet fields from an admin request. Only whitelisted fields
 * are returned. `partial` = true for PATCH (fields optional).
 */
export function parseProductFields(
  body: unknown,
  partial: boolean
): { error: string } | { data: Record<string, unknown> } {
  if (!body || typeof body !== "object") return { error: "Invalid request body." };
  const b = body as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if (!partial || "name" in b) {
    const name = cleanText(b.name, 100);
    if (!name) return { error: "Name is required." };
    data.name = name;
  }
  if (!partial || "price" in b) {
    const price = num(b.price, 1, 1_000_000);
    if (price === null) return { error: "Price must be a positive number." };
    data.price = price;
  }
  if ("cost" in b) {
    const cost = num(b.cost, 0, 1_000_000);
    if (cost === null) return { error: "Cost must be zero or a positive number." };
    data.cost = cost;
  }
  if ("description" in b) data.description = cleanText(b.description, 1000);
  if ("category" in b) data.category = cleanText(b.category, 50) || "Bouquets";
  if ("image" in b) {
    if (!isSafeImageUrl(b.image)) return { error: "Image must be uploaded through the admin panel." };
    data.image = b.image;
  }
  for (const flag of ["available", "customizable", "featured"] as const) {
    if (flag in b) {
      if (typeof b[flag] !== "boolean") return { error: `${flag} must be true or false.` };
      data[flag] = b[flag];
    }
  }
  if ("leadTimeHours" in b) {
    const n = num(b.leadTimeHours, 0, 720);
    if (n === null || !Number.isInteger(n)) {
      return { error: "Order-before time must be a whole number of hours (0–720)." };
    }
    data.leadTimeHours = n;
  }
  if ("featuredOrder" in b) {
    const n = num(b.featuredOrder, 0, 50);
    if (n === null || !Number.isInteger(n)) return { error: "Featured order must be a whole number." };
    data.featuredOrder = n;
  }
  return { data };
}
