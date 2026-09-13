import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { isDatabaseConfigured, connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

/**
 * One-time admin account creation.
 *
 * GET  — tells the /admin/setup page whether setup has already happened.
 * POST — creates the first account. Refuses if any user already exists,
 *        so this can be left in the codebase safely after initial setup.
 *
 * Note: there is a short window right after this deploys where anyone
 * who finds this URL before you could create the first account. Run
 * setup yourself immediately after deploying, before sharing any link.
 */
export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ setupComplete: false, error: "MONGODB_URI is not set." });
  }
  try {
    await connectToDatabase();
    const count = await User.countDocuments();
    return NextResponse.json({ setupComplete: count > 0 });
  } catch (err) {
    console.error("Failed to check setup status:", err);
    return NextResponse.json({ setupComplete: false, error: "Database unreachable." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "MONGODB_URI is not set." }, { status: 400 });
  }

  const { name, email, password } = await req.json();

  if (!email?.trim() || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  try {
    await connectToDatabase();

    const existing = await User.countDocuments();
    if (existing > 0) {
      return NextResponse.json(
        { error: "Setup has already been completed. Go to /admin/login instead." },
        { status: 403 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({
      email: email.toLowerCase().trim(),
      passwordHash,
      name: name?.trim() || "",
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("Failed to create admin account:", err);
    return NextResponse.json({ error: "Could not create account." }, { status: 500 });
  }
}
