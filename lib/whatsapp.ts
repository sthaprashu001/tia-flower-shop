// lib/whatsapp.ts - WhatsApp notification service using Twilio

import { isDatabaseConfigured, connectToDatabase } from "@/lib/mongodb";
import { siteUrl } from "@/lib/site";
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
  items: Array<{ bouquetId: string; quantity: number; name?: string }>;
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
    .map((i) => `• ${i.name || `Bouquet ${i.bouquetId}`} ×${i.quantity}`)
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

👉 Manage: ${siteUrl}/admin/orders`;
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

    // Twilio's REST API called directly with fetch — no extra npm package needed.
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: `whatsapp:${whatsappNumber}`,
        To: `whatsapp:${to}`,
        Body: message,
      }),
    });

    if (!res.ok) {
      // Log Twilio's status only — the body could echo the message text.
      console.error(`[WhatsApp] Twilio rejected the message (HTTP ${res.status})`);
      return;
    }
    console.log("[WhatsApp] Order notification sent");
  } catch (error) {
    console.error("[WhatsApp] Failed to send message:", error);
    // Don't throw - notifications are not critical
  }
}
