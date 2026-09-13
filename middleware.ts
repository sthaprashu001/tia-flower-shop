import { withAuth } from "next-auth/middleware";

// Only /admin/dashboard and /admin/products require a real session.
// /admin/login and /admin/setup must stay public — that's how you get in.
//
// This can't import authOptions from lib/auth.ts directly — that file
// pulls in mongoose/bcrypt, which don't run on the Edge middleware
// runtime — so the sign-in page is repeated here instead.
export default withAuth({
  pages: {
    signIn: "/admin/login",
  },
});

export const config = {
  matcher: ["/admin/dashboard/:path*", "/admin/products/:path*"],
};

