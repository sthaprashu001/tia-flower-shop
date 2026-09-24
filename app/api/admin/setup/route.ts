import { NextRequest, NextResponse } from "next/server";
import { isDatabaseConfigured, connectToDatabase } from "@/lib/mongodb";
import { hashPassword, safeEqual } from "@/lib/password";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rateLimit";
import { cleanText, isEmail, isValidPassword } from "@/lib/validation";
import User from "@/models/User";

/**
 * One-time admin account creation.
 *
 * GET  — tells the /admin/setup page whether setup has already happened.
 * POST — creates the first account (as SUPER_ADMIN). Refuses if any user
 *        already exists, and requires the SETUP_TOKEN env var so nobody
 *        else can claim the account in the window after a fresh deploy.
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
  const limit = rateLimit(`setup:${clientIp(req.headers)}`, 5, 15 * 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "MONGODB_URI is not set." }, { status: 400 });
  }

  const setupToken = process.env.SETUP_TOKEN;
  if (!setupToken && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Set the SETUP_TOKEN environment variable, redeploy, then try again." },
      { status: 403 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (setupToken && !(typeof body.setupToken === "string" && safeEqual(body.setupToken, setupToken))) {
    return NextResponse.json({ error: "Incorrect setup token." }, { status: 403 });
  }

  const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
  const password = body.password;
  const name = cleanText(body.name, 100);

  if (!isEmail(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  if (!isValidPassword(password)) {
    return NextResponse.json({ error: "Password must be 8–128 characters." }, { status: 400 });
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

    const passwordHash = await hashPassword(password);
    await User.create({ email, passwordHash, name, role: "SUPER_ADMIN" });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("Failed to create admin account:", err);
    return NextResponse.json({ error: "Could not create account." }, { status: 500 });
  }
}
