import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guards";
import { getShopSettings, updateShopSettings } from "@/lib/shopSettings";
import { isDatabaseConfigured } from "@/lib/mongodb";

// GET — public, used by the OPEN/BUSY/CLOSED badge shown to customers.
export async function GET() {
  const settings = await getShopSettings();
  return NextResponse.json(settings);
}

// PATCH — admin-only, used by the dashboard's shop settings section.
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "MONGODB_URI is not set — connect a database to make this editable." },
      { status: 400 }
    );
  }

  let body: { status?: unknown; capacityPerHour?: unknown; openHour?: unknown; closeHour?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const updates: {
    status?: "OPEN" | "BUSY" | "CLOSED";
    capacityPerHour?: number;
    openHour?: number;
    closeHour?: number;
  } = {};

  if (body.status) {
    if (body.status !== "OPEN" && body.status !== "BUSY" && body.status !== "CLOSED") {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    updates.status = body.status;
  }
  if (body.capacityPerHour !== undefined) {
    const n = Number(body.capacityPerHour);
    if (!Number.isInteger(n) || n < 1 || n > 200) {
      return NextResponse.json({ error: "Capacity must be a whole number between 1 and 200." }, { status: 400 });
    }
    updates.capacityPerHour = n;
  }

  if (body.openHour !== undefined || body.closeHour !== undefined) {
    const current = await getShopSettings();
    const open = body.openHour !== undefined ? Number(body.openHour) : current.openHour;
    const close = body.closeHour !== undefined ? Number(body.closeHour) : current.closeHour;
    if (!Number.isInteger(open) || !Number.isInteger(close) || open < 0 || open > 23 || close < 1 || close > 24) {
      return NextResponse.json({ error: "Hours must be whole numbers (open 0–23, close 1–24)." }, { status: 400 });
    }
    if (open >= close) {
      return NextResponse.json({ error: "Closing hour must be later than opening hour." }, { status: 400 });
    }
    updates.openHour = open;
    updates.closeHour = close;
  }

  try {
    const settings = await updateShopSettings(updates);
    return NextResponse.json(settings);
  } catch (err) {
    console.error("Failed to update shop settings:", err);
    return NextResponse.json({ error: "Could not update settings." }, { status: 500 });
  }
}
