import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDatabaseConfigured, connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

// PATCH - Set/Reset admin password (Super Admin only)
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
        { error: "Only super admin can set passwords" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { password } = body;

    if (!password || !password.trim()) {
      return NextResponse.json(
        { error: "Password cannot be empty" },
        { status: 400 }
      );
    }

    if (password.trim().length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password.trim(), 10);

    // Update the admin's password
    const admin = await User.findByIdAndUpdate(
      params.id,
      { passwordHash },
      { new: true }
    ).select("-passwordHash");

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
    return NextResponse.json(
      { error: "Could not set password" },
      { status: 500 }
    );
  }
}
