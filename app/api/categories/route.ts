import { NextResponse } from "next/server";
import { getCategories } from "@/lib/products";

// GET /api/categories — get all distinct product categories.
export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ categories });
  } catch (err) {
    console.error("Failed to load categories:", err);
    return NextResponse.json(
      { categories: ["Bouquets"], warning: "Failed to load all categories" },
      { status: 200 }
    );
  }
}
