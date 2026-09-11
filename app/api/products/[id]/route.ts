import { NextRequest, NextResponse } from "next/server";
import { isDatabaseConfigured, connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";

// Same lightweight admin check used elsewhere in the admin API.
// Replace with real auth (Phase 3, docs/NEXT_STEPS.md) before adding staff logins.
function isAuthorized(req: NextRequest): boolean {
  const key = req.nextUrl.searchParams.get("key") || req.headers.get("x-admin-key");
  const expected = process.env.ADMIN_API_KEY;
  return Boolean(expected) && key === expected;
}

// PATCH /api/products/[id]?key=ADMIN_API_KEY — edit an existing bouquet.
// Send only the fields you want to change.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "MONGODB_URI is not set." }, { status: 400 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  for (const field of ["name", "price", "description", "image", "available", "customizable", "cost"]) {
    if (field in body) updates[field] = body[field];
  }

  try {
    await connectToDatabase();
    const product = await Product.findByIdAndUpdate(params.id, updates, { new: true });
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    return NextResponse.json({ product });
  } catch (err) {
    console.error("Failed to update product:", err);
    return NextResponse.json({ error: "Could not update product." }, { status: 500 });
  }
}

// DELETE /api/products/[id]?key=ADMIN_API_KEY — remove a bouquet.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "MONGODB_URI is not set." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const product = await Product.findByIdAndDelete(params.id);
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to delete product:", err);
    return NextResponse.json({ error: "Could not delete product." }, { status: 500 });
  }
}
