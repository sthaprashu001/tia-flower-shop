import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDatabaseConfigured, connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

// PATCH - Update admin details
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    await connectToDatabase();

    // Check if user is SUPER_ADMIN
    const currentUser = await User.findOne({ email: session.user?.email });
    if (currentUser?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only super admin can update admins" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, whatsappNumber, notifyOrders, isActive } = body;

    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (whatsappNumber !== undefined) updates.whatsappNumber = whatsappNumber.trim();
    if (notifyOrders !== undefined) updates.notifyOrders = notifyOrders;
    if (isActive !== undefined) updates.isActive = isActive;

    const admin = await User.findByIdAndUpdate(params.id, updates, {
      new: true,
    }).select("-passwordHash");

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
    return NextResponse.json(
      { error: "Could not update admin" },
      { status: 500 }
    );
  }
}

// DELETE - Remove admin
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      );
    }

    await connectToDatabase();

    // Check if user is SUPER_ADMIN
    const currentUser = await User.findOne({ email: session.user?.email });
    if (currentUser?.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Only super admin can delete admins" },
        { status: 403 }
      );
    }

    // Prevent deleting self
    if (String(currentUser._id) === params.id) {
      return NextResponse.json(
        { error: "Cannot delete your own admin account" },
        { status: 400 }
      );
    }

    const admin = await User.findByIdAndDelete(params.id);

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Admin deleted successfully" });
  } catch (err) {
    console.error("Failed to delete admin:", err);
    return NextResponse.json(
      { error: "Could not delete admin" },
      { status: 500 }
    );
  }
}
