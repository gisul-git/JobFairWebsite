import { decode } from "next-auth/jwt";

import { connectDB } from "@/lib/mongodb";
import { sanitizeUser } from "@/lib/sanitize-user";
import { User } from "@/models/User";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

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

  const user = await User.findById(userId).exec();
  if (!user) {
    const body: ApiResponse = { ok: false, error: "User not found" };
    return Response.json(body, { status: 404 });
  }

  user.funnel.currentStep = 8;
  const nextCompleted = new Set<number>(user.funnel.completedSteps ?? []);
  nextCompleted.add(7);
  user.funnel.completedSteps = Array.from(nextCompleted).sort((a, b) => a - b);
  user.funnel.completedAt = new Date();

  await user.save();

  const updatedUser = sanitizeUser(user.toObject());
  const body: ApiResponse = { ok: true, data: updatedUser };
  return Response.json(body, { status: 200 });
}

