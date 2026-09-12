import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

/**
 * POST /api/upload?key=ADMIN_API_KEY
 * Body: multipart/form-data with a "file" field.
 *
 * Uploads an image to Vercel Blob storage and returns its public URL.
 * That URL is what gets saved into a product's `image` field — MongoDB
 * stores the link, Vercel Blob stores the actual file.
 *
 * As of mid-2026, new Blob stores connected to a project use OIDC
 * authentication by default (BLOB_STORE_ID + an auto-rotating token the
 * SDK reads automatically) rather than the older static
 * BLOB_READ_WRITE_TOKEN. Either is fine — @vercel/blob's `put()` picks
 * up whichever is present with no extra code needed.
 */
function isAuthorized(req: NextRequest): boolean {
  const key = req.nextUrl.searchParams.get("key") || req.headers.get("x-admin-key");
  const expected = process.env.ADMIN_API_KEY;
  return Boolean(expected) && key === expected;
}

const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasOidcBlob = Boolean(process.env.BLOB_STORE_ID);
  const hasStaticToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  if (!hasOidcBlob && !hasStaticToken) {
    return NextResponse.json(
      { error: "Image storage is not set up yet. Add a Blob store in your Vercel project (Storage tab)." },
      { status: 400 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPG, PNG, or WEBP images are allowed." }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Image must be under 4MB." }, { status: 400 });
  }

  try {
    const blob = await put(`products/${Date.now()}-${file.name}`, file, {
      access: "public",
    });
    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (err) {
    console.error("Failed to upload image:", err);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
