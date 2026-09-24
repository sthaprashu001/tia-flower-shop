import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireAdmin } from "@/lib/guards";
import { bouquets } from "@/lib/data";
import { isDatabaseConfigured, connectToDatabase } from "@/lib/mongodb";
import { parseProductFields } from "@/lib/validation";
import Product from "@/models/Product";

// Availability and lead times change from the admin panel at any time, so
// this must never be cached.
export const dynamic = "force-dynamic";

// `cost` is the shop's private buying price (used for the admin profit view).
// It must only ever be sent to a logged-in, active admin — never to customers.
async function callerIsAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  if (!session) return false; // fast path for normal visitors: no DB lookup
  const auth = await requireAdmin();
  return !("error" in auth);
}

// GET /api/products — list bouquets.
// Falls back to the mock data in lib/data.ts until MONGODB_URI is set.
export async function GET() {
  const isAdmin = await callerIsAdmin();

  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      source: "mock",
      products: bouquets.map((b) => (isAdmin ? b : stripCost(b))),
    });
  }

  try {
    await connectToDatabase();
    const rawProducts = await Product.find().lean();
    // Normalize all products to have consistent structure
    const products = rawProducts.map((p) => ({
      id: String(p._id),
      _id: String(p._id),
      name: p.name || "",
      price: p.price || 0,
      description: p.description || "",
      image: p.image || "",
      available: p.available !== false,
      customizable: p.customizable === true,
      ...(isAdmin ? { cost: p.cost || 0 } : {}),
      category: p.category || "Bouquets",
      featured: p.featured === true, // Explicitly convert to boolean
      featuredOrder: Number(p.featuredOrder) || 0,
      leadTimeHours: Number(p.leadTimeHours) || 0,
    }));
    return NextResponse.json({ source: "database", products });
  } catch (err) {
    console.error("Failed to load products from database:", err);
    return NextResponse.json(
      { source: "mock", products: bouquets.map(stripCost), warning: "Database unreachable, showing mock data" },
      { status: 200 }
    );
  }
}

function stripCost<T extends object>(item: T): Omit<T, "cost"> {
  const { cost: _cost, ...rest } = item as T & { cost?: unknown };
  return rest;
}

// POST /api/products — create a new bouquet. Requires a logged-in admin.
// Requires MONGODB_URI to be set; the mock catalog in lib/data.ts is
// read-only code, so there is nothing to write to until the database
// is connected.
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "MONGODB_URI is not set. Connect a database before adding products." },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = parseProductFields(body, false);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    await connectToDatabase();
    const product = await Product.create({
      description: "",
      image: "",
      available: true,
      customizable: false,
      cost: 0,
      category: "Bouquets",
      featured: false,
      featuredOrder: 0,
      ...parsed.data,
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    console.error("Failed to create product:", err);
    return NextResponse.json({ error: "Could not create product." }, { status: 500 });
  }
}
