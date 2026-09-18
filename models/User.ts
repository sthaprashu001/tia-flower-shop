import mongoose, { Schema, models, model } from "mongoose";

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, default: "" },
    role: { type: String, enum: ["SUPER_ADMIN", "ADMIN"], default: "ADMIN" },
    whatsappNumber: { type: String, default: "" }, // Format: +977XXXXXXXXXX
    isActive: { type: Boolean, default: true },
    notifyOrders: { type: Boolean, default: true }, // Should they get order notifications
  },
  { timestamps: true }
);

export default models.User || model("User", UserSchema);

