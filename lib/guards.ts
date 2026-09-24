import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { isObjectId } from "@/lib/validation";
import User from "@/models/User";

/**
 * Server-side permission checks for API routes.
 *
 * Unlike a bare `getServerSession()` check, these:
 *  - re-load the user from the database on every request, so a deleted or
 *    deactivated admin loses access immediately (not when their JWT expires)
 *  - read the role from the database, never from the client
 *  - reject cross-site state-changing requests (Origin must match Host)
 *
 * Usage:
 *   const auth = await requireAdmin(req);
 *   if ("error" in auth) return auth.error;
 */
export type AuthResult =
  | { error: NextResponse }
  | { user: { id: string; email: string; role: "SUPER_ADMIN" | "ADMIN" } };

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser client; browsers always send Origin on POST/PATCH/DELETE
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

export async function requireAdmin(req?: NextRequest): Promise<AuthResult> {
  if (req && !["GET", "HEAD", "OPTIONS"].includes(req.method) && !sameOrigin(req)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: string } | undefined)?.id;
  if (!id || !isObjectId(id)) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  try {
    await connectToDatabase();
    const user = await User.findById(id).select("email role isActive").lean<{
      email: string;
      role: "SUPER_ADMIN" | "ADMIN";
      isActive?: boolean;
    } | null>();
    if (!user || user.isActive === false) {
      return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }
    return { user: { id, email: user.email, role: user.role } };
  } catch (err) {
    console.error("Auth check failed:", err);
    return { error: NextResponse.json({ error: "Service unavailable" }, { status: 503 }) };
  }
}

export async function requireSuperAdmin(req?: NextRequest): Promise<AuthResult> {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth;
  if (auth.user.role !== "SUPER_ADMIN") {
    return { error: NextResponse.json({ error: "Only the super admin can do this." }, { status: 403 }) };
  }
  return auth;
}
