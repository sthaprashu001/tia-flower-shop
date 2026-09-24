import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guards";
import { isDatabaseConfigured, connectToDatabase } from "@/lib/mongodb";
import { isObjectId, parseProductFields } from "@/lib/validation";
import Product from "@/models/Product";

// PATCH /api/products/[id] — edit an existing bouquet.
// Send only the fields you want to change.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "MONGODB_URI is not set." }, { status: 400 });
  }
  if (!isObjectId(params.id)) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Whitelisted, type-checked fields only.
  const parsed = parseProductFields(body, true);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    await connectToDatabase();
    const product = await Product.findByIdAndUpdate(params.id, { $set: parsed.data }, { new: true });
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    return NextResponse.json({ product });
  } catch (err) {
    console.error("Failed to update product:", err);
    return NextResponse.json({ error: "Could not update product." }, { status: 500 });
  }
}

// DELETE /api/products/[id] — remove a bouquet.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "MONGODB_URI is not set." }, { status: 400 });
  }
  if (!isObjectId(params.id)) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
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
