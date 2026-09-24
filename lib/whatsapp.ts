// lib/whatsapp.ts - WhatsApp notification service using Twilio

import { isDatabaseConfigured, connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

interface WhatsAppNotificationPayload {
  orderNumber: string;
  customerName: string;
  phone: string;
  date: string;
  time: string;
  location: string;
  total: number;
  urgent: boolean;
  items: Array<{ bouquetId: string; quantity: number }>;
}

export async function sendWhatsAppNotificationToAdmins(
  orderData: WhatsAppNotificationPayload
) {
  try {
    if (!isDatabaseConfigured()) {
      console.log("[WhatsApp] Database not configured, skipping notifications");
      return;
    }

    await connectToDatabase();

    // Get all active admins who want order notifications
    const admins = await User.find({
      role: { $in: ["SUPER_ADMIN", "ADMIN"] },
      isActive: true,
      notifyOrders: true,
      whatsappNumber: { $exists: true, $ne: "" },
    }).select("whatsappNumber name");

    if (admins.length === 0) {
      console.log("[WhatsApp] No admins configured for notifications");
      return;
    }

    // Build message
    const message = formatOrderMessage(orderData);

    // Send to each admin
    for (const admin of admins) {
      await sendWhatsAppMessage(admin.whatsappNumber, message);
    }

    console.log(
      `[WhatsApp] Sent order notifications to ${admins.length} admin(s)`
    );
  } catch (error) {
    console.error("[WhatsApp] Failed to send notifications:", error);
    // Don't fail the order if notifications fail
  }
}

function formatOrderMessage(order: WhatsAppNotificationPayload): string {
  const urgentEmoji = order.urgent ? "🚨 *URGENT* " : "";
  const itemsList = order.items
    .map((i) => `• Bouquet ${i.bouquetId} ×${i.quantity}`)
    .join("\n");

  return `${urgentEmoji}NEW ORDER 🌹

*Order:* ${order.orderNumber}
*Customer:* ${order.customerName}
*Phone:* ${order.phone}

*Date & Time:* ${order.date} at ${order.time}
*Location:* ${order.location}

*Items:*
${itemsList}

*Total:* Rs. ${order.total}

👉 Manage: https://tiaflowershop.online/admin/orders`;
}

async function sendWhatsAppMessage(to: string, message: string) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

    if (!accountSid || !authToken || !whatsappNumber) {
      // Never log the recipient number or message body (customer details).
      console.log("[WhatsApp] Twilio credentials not configured, message not sent.");
      return;
    }

    // Format numbers for Twilio
    const fromNumber = `whatsapp:${whatsappNumber}`;
    const toNumber = `whatsapp:${to}`;

    // Use Twilio SDK
    const twilio = require("twilio");
    const client = twilio(accountSid, authToken);

    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: toNumber,
    });

    console.log(`[WhatsApp] Message sent (SID: ${result.sid})`);
  } catch (error) {
    console.error("[WhatsApp] Failed to send message:", error);
    // Don't throw - notifications are not critical
  }
}
