import mongoose, { Schema, models, model } from "mongoose";

const ProductSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, default: "" },
    // Cover photo (always equal to images[0] when images exist). Kept so the
    // homepage, cart, orders and older products keep working unchanged.
    image: { type: String, default: "" },
    // Slider photos (first one is the cover). Up to 8.
    images: { type: [String], default: [] },
    available: { type: Boolean, default: true },
    customizable: { type: Boolean, default: false },
    // simple cost tracking for the admin profit view (never sent to customers)
    cost: { type: Number, default: 0 },
    // product category: "Bouquets", "Khata", "Flags", etc.
    category: { type: String, default: "Bouquets" },
    featured: { type: Boolean, default: false },
    todayPick: { type: Boolean, default: false },
    // Position in the homepage tossed-photos pile (1-12, 0 = not shown)
    featuredOrder: { type: Number, default: 0 },
    // Position in the "All products" catalog view (1-999, 0 = not numbered)
    catalogOrder: { type: Number, default: 0, min: 0, max: 999 },
    // Position inside this product's own category section (Bouquets, Khata, Flags…)
    categoryOrder: { type: Number, default: 0, min: 0, max: 999 },
    // Minimum notice in minutes before pickup. 0 = no minimum.
    leadTimeMinutes: { type: Number, default: 0, min: 0, max: 43200 },
    // "fresh" | "artificial" | "other" — "" means not set yet.
    kind: { type: String, enum: ["fresh", "artificial", "other", ""], default: "" },
    // Short size note shown on the card, e.g. "7 roses".
    sizeNote: { type: String, default: "", maxlength: 60 },
  },
  { timestamps: true }
);

export default models.Product || model("Product", ProductSchema);
