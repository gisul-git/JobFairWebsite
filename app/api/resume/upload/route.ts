import { connectDB } from "@/lib/mongodb";
import { uploadToBlob } from "@/lib/azure-blob";
import { getPointsForStep } from "@/lib/points";
import { decode } from "next-auth/jwt";
import { sanitizeUser } from "@/lib/sanitize-user";
import { User } from "@/models/User";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXT = ["pdf", "doc", "docx"] as const;
type AllowedExt = (typeof ALLOWED_EXT)[number];

function getExt(filename: string): AllowedExt | null {
  const parts = filename.split(".");
  const ext = parts[parts.length - 1]?.toLowerCase();
  if (!ext) return null;
  if (!ALLOWED_EXT.includes(ext as AllowedExt)) return null;
  return ext as AllowedExt;
}

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice("Bearer ".length);
}

export async function POST(req: Request): Promise<Response> {
  await connectDB();

  const token = getBearerToken(req);
  if (!token) {
    const body: ApiResponse = { ok: false, error: "Missing Bearer token" };
    return Response.json(body, { status: 401 });
  }

  const secret = process.env.NEXTAUTH_SECRET ?? "dev-secret";
  const decoded = await decode({ secret, salt: "register", token });
  const decodedSub = (decoded as any)?.sub ?? (decoded as any)?.token?.sub;
  const userId = decodedSub ? String(decodedSub) : null;
  if (!userId) {
    const body: ApiResponse = { ok: false, error: "Invalid token" };
    return Response.json(body, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    const body: ApiResponse = { ok: false, error: "Invalid multipart form" };
    return Response.json(body, { status: 400 });
  }

  const roleRaw = formData.get("role");
  const role = roleRaw ? String(roleRaw).trim() : "";
  if (role !== "BDE" && role !== "Fullstack") {
    const body: ApiResponse = { ok: false, error: "Invalid role" };
    return Response.json(body, { status: 400 });
  }

  const fileRaw = formData.get("file");
  if (!fileRaw) {
    const body: ApiResponse = { ok: false, error: "Missing file" };
    return Response.json(body, { status: 400 });
  }

  // Next.js returns a File-like object for multipart.
  const file = fileRaw as unknown as File;
  const originalFilename = (file as any).name ? String((file as any).name) : "resume";
  const ext = getExt(originalFilename);
  if (!ext) {
    const body: ApiResponse = { ok: false, error: "Invalid file type" };
    return Response.json(body, { status: 400 });
  }

  const size = (file as any).size;
  if (typeof size !== "number" || size <= 0) {
    const body: ApiResponse = { ok: false, error: "Invalid file size" };
    return Response.json(body, { status: 400 });
  }
  if (size > MAX_BYTES) {
    const body: ApiResponse = { ok: false, error: "File too large. Max 5MB" };
    return Response.json(body, { status: 400 });
  }

  const buffer = Buffer.from(await (file as any).arrayBuffer());
  const timestamp = Date.now();
  const blobFilename = `${userId}_${timestamp}.${ext}`;

  const blobUrl = await uploadToBlob(buffer, blobFilename);

  const user = await User.findById(userId).exec();
  if (!user) {
    const body: ApiResponse = { ok: false, error: "User not found" };
    return Response.json(body, { status: 404 });
  }

  user.resume = {
    uploaded: true,
    uploadedAt: new Date(),
    blobUrl,
    filename: originalFilename,
  };
  user.role = role;

  user.funnel.currentStep = 4;
  const nextCompleted = new Set<number>(user.funnel.completedSteps ?? []);
  nextCompleted.add(3);
  user.funnel.completedSteps = Array.from(nextCompleted).sort((a, b) => a - b);

  user.points = getPointsForStep(4);

  await user.save();

  const updatedUser = sanitizeUser(user.toObject());
  const body: ApiResponse = { ok: true, data: updatedUser };
  return Response.json(body, { status: 200 });
}

