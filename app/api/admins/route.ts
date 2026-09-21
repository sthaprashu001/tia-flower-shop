import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDatabaseConfigured, connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

// GET - Get all admins
export async function GET(req: NextRequest) {
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
        { error: "Only super admin can manage admins" },
        { status: 403 }
      );
    }

    const admins = await User.find({ role: { $in: ["SUPER_ADMIN", "ADMIN"] } })
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    return NextResponse.json({
      admins: admins.map((a) => ({
        _id: String(a._id),
        id: String(a._id),
        email: a.email,
        name: a.name,
        role: a.role,
        whatsappNumber: a.whatsappNumber,
        isActive: a.isActive,
        notifyOrders: a.notifyOrders,
        createdAt: a.createdAt,
      })),
    });
  } catch (err) {
    console.error("Failed to fetch admins:", err);
    return NextResponse.json(
      { error: "Could not fetch admins" },
      { status: 500 }
    );
  }
}

// POST - Add new admin
export async function POST(req: NextRequest) {
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
        { error: "Only super admin can add admins" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, name, whatsappNumber, notifyOrders } = body;

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Admin with this email already exists" },
        { status: 400 }
      );
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).substring(2, 10);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const newAdmin = await User.create({
      email: email.toLowerCase().trim(),
      name: name?.trim() || "",
      passwordHash,
      role: "ADMIN",
      whatsappNumber: whatsappNumber?.trim() || "",
      notifyOrders: notifyOrders !== false,
      isActive: true,
    });

    return NextResponse.json(
      {
        admin: {
          _id: String(newAdmin._id),
          id: String(newAdmin._id),
          email: newAdmin.email,
          name: newAdmin.name,
          role: newAdmin.role,
          whatsappNumber: newAdmin.whatsappNumber,
          isActive: newAdmin.isActive,
          notifyOrders: newAdmin.notifyOrders,
        },
        tempPassword, // Send this to admin (via email in production)
        message: "Admin created. Share the temp password with them.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Failed to create admin:", err);
    return NextResponse.json(
      { error: "Could not create admin" },
      { status: 500 }
    );
  }
}
