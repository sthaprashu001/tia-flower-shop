import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getShopSettings, updateShopSettings } from "@/lib/shopSettings";
import { isDatabaseConfigured } from "@/lib/mongodb";

// GET — public, used by the OPEN/BUSY/CLOSED badge shown to customers.
export async function GET() {
  const settings = await getShopSettings();
  return NextResponse.json(settings);
}

// PATCH — admin-only, used by the dashboard's shop settings section.
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "MONGODB_URI is not set — connect a database to make this editable." },
      { status: 400 }
    );
  }

  const body = await req.json();
  const updates: { status?: "OPEN" | "BUSY" | "CLOSED"; capacityPerHour?: number } = {};

  if (body.status) {
    if (!["OPEN", "BUSY", "CLOSED"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    updates.status = body.status;
  }
  if (body.capacityPerHour !== undefined) {
    const n = Number(body.capacityPerHour);
    if (!Number.isFinite(n) || n < 1) {
      return NextResponse.json({ error: "Capacity must be a positive number." }, { status: 400 });
    }
    updates.capacityPerHour = n;
  }

  try {
    const settings = await updateShopSettings(updates);
    return NextResponse.json(settings);
  } catch (err) {
    console.error("Failed to update shop settings:", err);
    return NextResponse.json({ error: "Could not update settings." }, { status: 500 });
  }
}
