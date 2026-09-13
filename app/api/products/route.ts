import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { bouquets } from "@/lib/data";
import { isDatabaseConfigured, connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";

// GET /api/products — list bouquets.
// Falls back to the mock data in lib/data.ts until MONGODB_URI is set.
export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ source: "mock", products: bouquets });
  }

  try {
    await connectToDatabase();
    const rawProducts = await Product.find().sort({ createdAt: -1 }).lean();
    // MongoDB documents come back with `_id`, but most of the app (order
    // form, homepage, bouquet cards) expects a plain `id` field like the
    // mock catalog uses. Add both so the admin panel (which reads `_id`)
    // and everything else (which reads `id`) work without extra changes.
    const products = rawProducts.map((p) => ({ ...p, id: String(p._id), _id: String(p._id) }));
    return NextResponse.json({ source: "database", products });
  } catch (err) {
    console.error("Failed to load products from database:", err);
    return NextResponse.json(
      { source: "mock", products: bouquets, warning: "Database unreachable, showing mock data" },
      { status: 200 }
    );
  }
}

// POST /api/products — create a new bouquet. Requires a logged-in admin session.
// Requires MONGODB_URI to be set; the mock catalog in lib/data.ts is
// read-only code, so there is nothing to write to until the database
// is connected.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "MONGODB_URI is not set. Connect a database before adding products." },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { name, price, description, image, available, customizable, cost } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (typeof price !== "number" || price <= 0) {
    return NextResponse.json({ error: "Price must be a positive number." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const product = await Product.create({
      name: name.trim(),
      price,
      description: description?.trim() || "",
      image: image || "",
      available: available ?? true,
      customizable: customizable ?? false,
      cost: cost ?? 0,
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    console.error("Failed to create product:", err);
    return NextResponse.json({ error: "Could not create product." }, { status: 500 });
  }
}
