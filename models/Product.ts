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
    // Display order on homepage (1-10)
    featuredOrder: { type: Number, default: 0 },
    // Minimum notice in minutes before pickup. 0 = no minimum.
    leadTimeMinutes: { type: Number, default: 0, min: 0, max: 43200 },
  },
  { timestamps: true }
);

export default models.Product || model("Product", ProductSchema);
