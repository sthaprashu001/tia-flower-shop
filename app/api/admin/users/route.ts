import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/guards";
import { hashPassword } from "@/lib/password";
import { cleanText, isEmail, isValidPassword } from "@/lib/validation";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

/**
 * Add or list admin accounts. Restricted to the SUPER_ADMIN — a regular
 * ADMIN (e.g. shop staff) must not be able to create more logins.
 * (The fuller admin manager lives at /api/admins.)
 */
export async function GET(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if ("error" in auth) return auth.error;

  await connectToDatabase();
  const users = await User.find().select("email name createdAt").lean();
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if ("error" in auth) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
  const name = cleanText(body.name, 100);
  if (!isEmail(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  if (!isValidPassword(body.password)) {
    return NextResponse.json({ error: "Password must be 8–128 characters." }, { status: 400 });
  }

  try {
    await connectToDatabase();

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }

    const passwordHash = await hashPassword(body.password);
    const user = await User.create({ email, passwordHash, name, role: "ADMIN" });
    return NextResponse.json({ user: { email: user.email, name: user.name } }, { status: 201 });
  } catch (err) {
    console.error("Failed to create staff account:", err);
    return NextResponse.json({ error: "Could not create account." }, { status: 500 });
  }
}
