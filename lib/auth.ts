import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { isDatabaseConfigured, connectToDatabase } from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";
import { rateLimit } from "@/lib/rateLimit";
import { isEmail } from "@/lib/validation";
import User from "@/models/User";

/**
 * Real admin authentication, replacing the Phase 1 shared ADMIN_API_KEY.
 *
 * Uses next-auth v4 (the stable release — v5/Auth.js is still in beta)
 * with a Credentials provider backed by a MongoDB User model. Sessions
 * are JWT-based (required for Credentials, no separate session
 * collection needed) and travel in an httpOnly cookie, never in
 * localStorage.
 *
 * First-time setup: visit /admin/setup once to create the first account.
 * That route refuses to run again once any user exists.
 */

// Compared against when the email doesn't exist, so a wrong email and a wrong
// password take about the same time (stops account-existence probing).
let dummyHash: string | null = null;

function ipFromRequest(req: unknown): string {
  const headers = (req as { headers?: Record<string, string | string[] | undefined> } | undefined)?.headers;
  const fwd = headers?.["x-forwarded-for"];
  const value = Array.isArray(fwd) ? fwd[0] : fwd;
  return value?.split(",")[0].trim() || "unknown";
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // 8 hours, then log in again
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const email = typeof credentials?.email === "string" ? credentials.email.toLowerCase().trim() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!isEmail(email) || !password || password.length > 128) return null;
        if (!isDatabaseConfigured()) return null;

        // Brute-force protection: 8 attempts per 15 minutes per (IP, email), 40 per IP.
        const ip = ipFromRequest(req);
        if (!rateLimit(`login:${ip}:${email}`, 8, 15 * 60_000).ok) return null;
        if (!rateLimit(`login-ip:${ip}`, 40, 15 * 60_000).ok) return null;

        await connectToDatabase();
        const user = await User.findOne({ email });

        if (!user) {
          dummyHash = dummyHash || (await hashPassword("not-a-real-password"));
          await bcrypt.compare(password, dummyHash);
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;
        if (user.isActive === false) return null; // deactivated admins can't log in

        return { id: String(user._id), email: user.email, name: user.name || user.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) (session.user as { id?: string }).id = token.id as string;
      return session;
    },
  },
};
