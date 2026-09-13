import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { isDatabaseConfigured, connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

/**
 * Real admin authentication, replacing the Phase 1 shared ADMIN_API_KEY.
 *
 * Uses next-auth v4 (the stable release — v5/Auth.js is still in beta)
 * with a Credentials provider backed by a MongoDB User model. Sessions
 * are JWT-based (required for Credentials, no separate session
 * collection needed).
 *
 * First-time setup: visit /admin/setup once to create the first account.
 * That route refuses to run again once any user exists.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        if (!isDatabaseConfigured()) return null;

        await connectToDatabase();
        const user = await User.findOne({ email: credentials.email.toLowerCase().trim() });
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

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
