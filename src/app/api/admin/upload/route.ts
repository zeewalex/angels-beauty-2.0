import { NextResponse } from "next/server";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { requireRole } from "@/lib/session";
import { checkOrigin } from "@/lib/csrf";
import { logAudit } from "@/lib/audit";
import { errorResponse } from "@/lib/schemas";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "hero");
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO = ["video/mp4", "video/webm"];

/**
 * POST /api/admin/upload — file upload for hero slides (images + videos).
 * Validates file type, size, and signature. Stores in /public/uploads/hero/.
 * Does NOT touch production Cloudinary.
 */
export async function POST(req: Request) {
  const session = await requireRole("ADMIN");
  if (!session) return errorResponse("Admin access required.", 403);
  if (!checkOrigin(req)) return errorResponse("Forbidden (CSRF).", 403);

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return errorResponse("No file provided.", 400);

  const isImage = ALLOWED_IMAGE.includes(file.type);
  const isVideo = ALLOWED_VIDEO.includes(file.type);
  if (!isImage && !isVideo) {
    return errorResponse(`Invalid file type: ${file.type}. Allowed: JPG, PNG, WebP, MP4, WebM.`, 400);
  }

  const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
  if (file.size > maxSize) {
    return errorResponse(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: ${maxSize / 1024 / 1024}MB.`, 400);
  }

  // Validate file signature (magic bytes)
  const buffer = Buffer.from(await file.arrayBuffer());
  const sig = buffer.subarray(0, 12).toString("hex");
  const validSigs: Record<string, string[]> = {
    "image/jpeg": ["ffd8ff"],
    "image/png": ["89504e47"],
    "image/webp": ["52494646"],
    "video/mp4": ["000000", "ftyp"],
    "video/webm": ["1a45dfa3"],
  };
  const expected = validSigs[file.type] || [];
  const matches = expected.some((s) => sig.startsWith(s.toLowerCase()));
  if (!matches) {
    return errorResponse("File signature does not match declared type.", 400);
  }

  // Ensure upload directory exists
  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

  // Generate unique filename
  const ext = file.name.split(".").pop() || (isImage ? "jpg" : "mp4");
  const filename = `${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  const filepath = join(UPLOAD_DIR, filename);
  writeFileSync(filepath, buffer);

  const publicUrl = `/uploads/hero/${filename}`;
  await logAudit(session, "upload.media", "Media", null, `Uploaded ${file.type} (${(file.size / 1024).toFixed(0)}KB) → ${publicUrl}`);

  return NextResponse.json({ ok: true, url: publicUrl, size: file.size, type: file.type });
}
