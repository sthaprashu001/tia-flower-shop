import mongoose from "mongoose";
import { Bouquet } from "./types";
import { bouquets as mockBouquets, getBouquetById as getMockBouquetById } from "./data";
import { isDatabaseConfigured, connectToDatabase } from "./mongodb";
import Product from "@/models/Product";

/**
 * Single source of truth for "what bouquets exist" across the whole app —
 * homepage, listing page, product detail page, and order pricing/validation
 * all call these two functions instead of importing lib/data.ts directly.
 *
 * When MONGODB_URI is set, this reads from the database. Otherwise it
 * transparently falls back to the mock catalog in lib/data.ts, so local
 * development without a database still works exactly as before.
 */

interface ProductDoc {
  _id: mongoose.Types.ObjectId;
  name: string;
  price: number;
  description?: string;
  image?: string;
  available: boolean;
  customizable: boolean;
}

function serialize(doc: ProductDoc): Bouquet {
  return {
    id: String(doc._id),
    name: doc.name,
    price: doc.price,
    description: doc.description || "",
    image: doc.image || "",
    available: doc.available,
    customizable: doc.customizable,
  };
}

export async function getAllBouquets(): Promise<Bouquet[]> {
  if (!isDatabaseConfigured()) return mockBouquets;

  try {
    await connectToDatabase();
    const docs = await Product.find().sort({ createdAt: -1 }).lean<ProductDoc[]>();
    return docs.map(serialize);
  } catch (err) {
    console.error("Failed to load products from database, using mock data:", err);
    return mockBouquets;
  }
}

export async function getBouquetById(id: string): Promise<Bouquet | undefined> {
  if (!isDatabaseConfigured()) return getMockBouquetById(id);

  // Mock ids like "custom" aren't valid MongoDB ObjectIds — avoid a crash
  // and just fall back, in case an old link is visited after switching to
  // the database.
  if (!mongoose.Types.ObjectId.isValid(id)) return getMockBouquetById(id);

  try {
    await connectToDatabase();
    const doc = await Product.findById(id).lean<ProductDoc | null>();
    return doc ? serialize(doc) : undefined;
  } catch (err) {
    console.error("Failed to load product from database, using mock data:", err);
    return getMockBouquetById(id);
  }
}
