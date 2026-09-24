import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAdmin } from "@/lib/guards";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rateLimit";

/**
 * POST /api/upload
 * Body: multipart/form-data with a "file" field.
 *
 * Uploads an image to Vercel Blob storage and returns its public URL.
 * That URL is what gets saved into a product's `image` field — MongoDB
 * stores the link, Vercel Blob stores the actual file.
 */
const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4MB

// The browser-supplied `file.type` and file name are easy to fake, so the real
// format is read from the file's first bytes ("magic numbers") instead.
function detectImageType(bytes: Uint8Array): { mime: string; ext: string } | null {
  const startsWith = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  if (startsWith([0xff, 0xd8, 0xff])) return { mime: "image/jpeg", ext: "jpg" };
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { mime: "image/png", ext: "png" };
  // WEBP = "RIFF" .... "WEBP"
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const limit = rateLimit(`upload:${auth.user.id}`, 30, 10 * 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const hasOidcBlob = Boolean(process.env.BLOB_STORE_ID);
  const hasStaticToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  if (!hasOidcBlob && !hasStaticToken) {
    return NextResponse.json(
      { error: "Image storage is not set up yet. Add a Blob store in your Vercel project (Storage tab)." },
      { status: 400 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Image must be under 4MB." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const detected = detectImageType(bytes);
  if (!detected) {
    return NextResponse.json({ error: "Only JPG, PNG, or WEBP images are allowed." }, { status: 400 });
  }

  try {
    // Server-chosen random name: the uploaded file name is never used, so it
    // can't inject path segments or odd characters into the storage path.
    const key = `products/${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${detected.ext}`;
    const blob = await put(key, new Blob([bytes], { type: detected.mime }), {
      access: "public",
      contentType: detected.mime,
      // Explicit token always takes priority over OIDC auto-detection
      // (see @vercel/blob docs on credential resolution order). Passing
      // it directly avoids ambiguity about which store OIDC resolves to.
      ...(process.env.BLOB_READ_WRITE_TOKEN ? { token: process.env.BLOB_READ_WRITE_TOKEN } : {}),
    });
    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (err) {
    // Details go to the server log only, never back to the browser.
    console.error("Failed to upload image:", err);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
