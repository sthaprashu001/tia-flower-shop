import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/guards";
import { connectToDatabase } from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";
import { rateLimit, tooManyRequests } from "@/lib/rateLimit";
import { isValidPassword } from "@/lib/validation";
import User from "@/models/User";

// PATCH /api/admins/me/password — any logged-in admin changes THEIR OWN password.
// Needs the current password too, so someone using an unlocked screen can't lock the owner out.
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const limit = rateLimit(`pwchange:${auth.user.id}`, 5, 15 * 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { currentPassword, newPassword } = body;
  if (typeof currentPassword !== "string" || !currentPassword || currentPassword.length > 128) {
    return NextResponse.json({ error: "Enter your current password." }, { status: 400 });
  }
  if (!isValidPassword(newPassword)) {
    return NextResponse.json({ error: "New password must be 8–128 characters." }, { status: 400 });
  }
  if (newPassword === currentPassword) {
    return NextResponse.json({ error: "New password must be different from the current one." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const user = await User.findById(auth.user.id);
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
    user.passwordHash = await hashPassword(newPassword);
    await user.save();
    return NextResponse.json({ message: "Password changed." });
  } catch (err) {
    console.error("Failed to change own password:", err);
    return NextResponse.json({ error: "Could not change password." }, { status: 500 });
  }
}
