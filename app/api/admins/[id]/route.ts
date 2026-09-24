import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/guards";
import { isDatabaseConfigured, connectToDatabase } from "@/lib/mongodb";
import { cleanText, isObjectId, isWhatsappNumber } from "@/lib/validation";
import User from "@/models/User";

// PATCH - Update admin details (super admin only)
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

    // Whitelist + type-check every field; role and email can never be changed here.
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = cleanText(body.name, 100);
    if (body.whatsappNumber !== undefined) {
      const wa = cleanText(body.whatsappNumber, 20);
      if (wa && !isWhatsappNumber(wa)) {
        return NextResponse.json(
          { error: "WhatsApp number must be in international format, e.g. +9779800000000" },
          { status: 400 }
        );
      }
      updates.whatsappNumber = wa;
    }
    if (body.notifyOrders !== undefined) {
      if (typeof body.notifyOrders !== "boolean") {
        return NextResponse.json({ error: "notifyOrders must be true or false." }, { status: 400 });
      }
      updates.notifyOrders = body.notifyOrders;
    }
    if (body.isActive !== undefined) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json({ error: "isActive must be true or false." }, { status: 400 });
      }
      if (body.isActive === false && auth.user.id === params.id) {
        return NextResponse.json({ error: "You cannot deactivate your own account." }, { status: 400 });
      }
      updates.isActive = body.isActive;
    }

    await connectToDatabase();
    const admin = await User.findByIdAndUpdate(params.id, { $set: updates }, { new: true }).select("-passwordHash");

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json({
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
    console.error("Failed to update admin:", err);
    return NextResponse.json({ error: "Could not update admin" }, { status: 500 });
  }
}

// DELETE - Remove admin (super admin only)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireSuperAdmin(req);
    if ("error" in auth) return auth.error;

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }
    if (!isObjectId(params.id)) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Prevent deleting self
    if (auth.user.id === params.id) {
      return NextResponse.json({ error: "Cannot delete your own admin account" }, { status: 400 });
    }

    await connectToDatabase();
    const admin = await User.findByIdAndDelete(params.id);

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Admin deleted successfully" });
  } catch (err) {
    console.error("Failed to delete admin:", err);
    return NextResponse.json({ error: "Could not delete admin" }, { status: 500 });
  }
}
