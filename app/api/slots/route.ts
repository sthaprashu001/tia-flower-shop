import { NextRequest, NextResponse } from "next/server";
import { getHourCounts } from "@/lib/orderSlots";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rateLimit";
import { getShopSettings } from "@/lib/shopSettings";
import { isIsoDate } from "@/lib/validation";

export const dynamic = "force-dynamic";

// GET /api/slots?date=YYYY-MM-DD — public. Powers the pickup-time buttons on
// the order form: opening hours, the hourly limit, and how many orders are
// already booked in each hour. Contains no customer information.
export async function GET(req: NextRequest) {
  const limit = rateLimit(`slots:${clientIp(req.headers)}`, 60, 10 * 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const date = new URL(req.url).searchParams.get("date");
  if (!isIsoDate(date)) {
    return NextResponse.json({ error: "A valid date is required." }, { status: 400 });
  }

  try {
    const [settings, counts] = await Promise.all([getShopSettings(), getHourCounts(date)]);
    return NextResponse.json({
      date,
      status: settings.status,
      openHour: settings.openHour,
      closeHour: settings.closeHour,
      capacityPerHour: settings.capacityPerHour,
      counts,
    });
  } catch (err) {
    console.error("Failed to load slots:", err);
    return NextResponse.json({ error: "Could not load pickup times." }, { status: 500 });
  }
}
