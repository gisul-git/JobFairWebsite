import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  await connectDB();

  const url = new URL(req.url);
  const code = url.searchParams.get("code")?.trim();

  if (!code) {
    const body: ApiResponse = { ok: true, data: { valid: false } };
    return Response.json(body, { status: 200 });
  }

  const user = await User.findOne({ referralCode: code }).lean();
  if (!user) {
    const body: ApiResponse = { ok: true, data: { valid: false } };
    return Response.json(body, { status: 200 });
  }

  const body: ApiResponse = { ok: true, data: { valid: true, name: user.name } };
  return Response.json(body, { status: 200 });
}

