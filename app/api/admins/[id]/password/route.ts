import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/guards";
import { isDatabaseConfigured, connectToDatabase } from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";
import { isObjectId, isValidPassword } from "@/lib/validation";
import User from "@/models/User";

// PATCH - Set/Reset admin password (Super Admin only)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireSuperAdmin(req);
    if ("error" in auth) return auth.error;

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }
    if (!isObjectId(params.id)) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    // Same rule everywhere (setup, add staff, reset): 8–128 characters.
    if (!isValidPassword(body.password)) {
      return NextResponse.json({ error: "Password must be 8–128 characters." }, { status: 400 });
    }

    await connectToDatabase();
    const passwordHash = await hashPassword(body.password);
    const admin = await User.findByIdAndUpdate(params.id, { $set: { passwordHash } }, { new: true }).select(
      "-passwordHash"
    );

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Password set successfully",
      admin: {
        _id: String(admin._id),
        id: String(admin._id),
        email: admin.email,
        name: admin.name,
        role: admin.role,
        whatsappNumber: admin.whatsappNumber,
        isActive: admin.isActive,
        notifyOrders: admin.notifyOrders,
      },
    });
  } catch (err) {
    console.error("Failed to set password:", err);
    return NextResponse.json({ error: "Could not set password" }, { status: 500 });
  }
}
