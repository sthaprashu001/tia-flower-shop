import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/guards";
import { isDatabaseConfigured, connectToDatabase } from "@/lib/mongodb";
import { generateTempPassword, hashPassword } from "@/lib/password";
import { cleanText, isEmail, isWhatsappNumber } from "@/lib/validation";
import User from "@/models/User";

// GET - Get all admins (super admin only)
export async function GET(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin(req);
    if ("error" in auth) return auth.error;

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    await connectToDatabase();

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
    return NextResponse.json({ error: "Could not fetch admins" }, { status: 500 });
  }
}

// POST - Add new admin (super admin only)
export async function POST(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin(req);
    if ("error" in auth) return auth.error;

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
    if (!isEmail(email)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }

    const whatsappNumber = cleanText(body.whatsappNumber, 20);
    if (whatsappNumber && !isWhatsappNumber(whatsappNumber)) {
      return NextResponse.json(
        { error: "WhatsApp number must be in international format, e.g. +9779800000000" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "Admin with this email already exists" }, { status: 400 });
    }

    // Cryptographically random temporary password
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    const newAdmin = await User.create({
      email,
      name: cleanText(body.name, 100),
      passwordHash,
      role: "ADMIN",
      whatsappNumber,
      notifyOrders: body.notifyOrders !== false,
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
        tempPassword, // Shown once — share it with them privately
        message: "Admin created. Share the temp password with them.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Failed to create admin:", err);
    return NextResponse.json({ error: "Could not create admin" }, { status: 500 });
  }
}
