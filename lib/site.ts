// NEXT_PUBLIC_SITE_URL should be set in .env.local and Vercel environment.
// Falls back to live domain as default (was vercel.app before custom domain purchase).
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tiaflowershop.online";
