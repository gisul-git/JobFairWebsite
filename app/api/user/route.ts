import { connectDB } from "@/lib/mongodb";
import { sanitizeUser } from "@/lib/sanitize-user";
import { User } from "@/models/User";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  await connectDB();

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId")?.trim();

  if (!userId) {
    const body: ApiResponse = { ok: false, error: "Missing userId" };
    return Response.json(body, { status: 400 });
  }

  const user = await User.findById(userId).lean();
  if (!user) {
    const body: ApiResponse = { ok: false, error: "User not found" };
    return Response.json(body, { status: 404 });
  }

  const body: ApiResponse = { ok: true, data: sanitizeUser(user) };
  return Response.json(body, { status: 200 });
}

