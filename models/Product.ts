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
  },
  { timestamps: true }
);

export default models.Product || model("Product", ProductSchema);
