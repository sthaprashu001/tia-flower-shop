import { Schema, models, model } from "mongoose";

const ShopSettingsSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["OPEN", "BUSY", "CLOSED"],
      default: "OPEN",
    },
    capacityPerHour: { type: Number, default: 8, min: 1 },
    // Pickup hours (shop time, 24h clock). Customers can only choose
    // pickup slots from openHour up to closeHour.
    openHour: { type: Number, default: 6, min: 0, max: 23 },
    closeHour: { type: Number, default: 22, min: 1, max: 24 },
  },
  { timestamps: true }
);

export default models.ShopSettings || model("ShopSettings", ShopSettingsSchema);
