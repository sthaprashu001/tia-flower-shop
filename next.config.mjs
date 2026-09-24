const isDev = process.env.NODE_ENV !== "production";

// Browser-enforced protections against XSS, clickjacking and content sniffing.
// Next.js needs inline scripts/styles to hydrate, hence 'unsafe-inline';
// 'unsafe-eval' is only allowed in dev (hot reload).
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
      "font-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // The mock/placeholder catalog (lib/data.ts) uses local .svg images;
    // next/image blocks SVGs by default. contentDispositionType keeps
    // this safe (forces download instead of inline execution for any
    // untrusted source, though these are all local files we control).
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    remotePatterns: [
      // Bouquet photos uploaded via the admin panel live in Vercel Blob,
      // on a per-store subdomain of this pattern.
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
