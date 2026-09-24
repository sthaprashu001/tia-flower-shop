import { withAuth } from "next-auth/middleware";

// Every /admin page requires a real session except the two entry points:
// /admin/login (how you get in) and /admin/setup (one-time first account).
// The API routes check the session again on the server — this middleware only
// keeps signed-out visitors from loading the admin screens at all.
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
  // Matches /admin, /admin/orders, /admin/admins, ... but not /admin/login or /admin/setup.
  matcher: ["/admin/((?!login|setup).*)"],
};
