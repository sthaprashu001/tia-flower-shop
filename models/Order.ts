import { Schema, models, model } from "mongoose";

const OrderItemSchema = new Schema(
  {
    bouquetId: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    items: { type: [OrderItemSchema], required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    meetingLocation: { type: String, required: true },
    customizationNote: { type: String, default: "" },
    personalMessage: { type: String, default: "" },
    urgent: { type: Boolean, default: false },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "PREPARING",
        "READY",
        "DELIVERED",
        "CANCELLED",
        "REJECTED",
      ],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

export default models.Order || model("Order", OrderSchema);
