import { NextRequest, NextResponse } from "next/server";
import { bouquets } from "@/lib/data";
import { isDatabaseConfigured, connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";

// Same lightweight admin check used by /api/orders (see Phase 3 note there
// about replacing this with real auth before handing out staff logins).
function isAuthorized(req: NextRequest): boolean {
  const key = req.nextUrl.searchParams.get("key") || req.headers.get("x-admin-key");
  const expected = process.env.ADMIN_API_KEY;
  return Boolean(expected) && key === expected;
}

// GET /api/products — list bouquets.
// Falls back to the mock data in lib/data.ts until MONGODB_URI is set.
export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ source: "mock", products: bouquets });
  }

  try {
    await connectToDatabase();
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ source: "database", products });
  } catch (err) {
    console.error("Failed to load products from database:", err);
    return NextResponse.json(
      { source: "mock", products: bouquets, warning: "Database unreachable, showing mock data" },
      { status: 200 }
    );
  }
}

// POST /api/products?key=ADMIN_API_KEY — create a new bouquet.
// Requires MONGODB_URI to be set; the mock catalog in lib/data.ts is
// read-only code, so there is nothing to write to until the database
// is connected.
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
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
