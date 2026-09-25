import mongoose, { Schema, models, model } from "mongoose";

const ProductSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    available: { type: Boolean, default: true },
    customizable: { type: Boolean, default: false },
    // simple cost tracking for the admin profit view (never sent to customers)
    cost: { type: Number, default: 0 },
    // product category: "Bouquets", "Khata", "Flags", etc.
    // defaults to "Bouquets" for backward compatibility with existing products
    category: { type: String, default: "Bouquets" },
    // Featured on homepage
    featured: { type: Boolean, default: false },
    todayPick: { type: Boolean, default: false },
    // Display order on homepage (1-7)
    featuredOrder: { type: Number, default: 0 },
    // Minimum notice: customers must order at least this many hours before
    // pickup (12 = "12 hours before", 24 = "1 day before"). 0 = no minimum.
    leadTimeHours: { type: Number, default: 0, min: 0, max: 720 },
  },
  { timestamps: true }
);

export default models.Product || model("Product", ProductSchema);
