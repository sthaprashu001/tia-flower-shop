import { NextResponse } from "next/server";
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
