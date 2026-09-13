import { Schema, models, model } from "mongoose";

const ShopSettingsSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["OPEN", "BUSY", "CLOSED"],
      default: "OPEN",
    },
    capacityPerHour: { type: Number, default: 8, min: 1 },
  },
  { timestamps: true }
);

export default models.ShopSettings || model("ShopSettings", ShopSettingsSchema);
