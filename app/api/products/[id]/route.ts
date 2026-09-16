import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDatabaseConfigured, connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";

// PATCH /api/products/[id] — edit an existing bouquet.
// Send only the fields you want to change.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "MONGODB_URI is not set." }, { status: 400 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  for (const field of ["name", "price", "description", "image", "available", "customizable", "cost", "category"]) {
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

// DELETE /api/products/[id] — remove a bouquet.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
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
