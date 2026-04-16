import { connectDB } from "@/lib/mongodb";
import { sanitizeUser } from "@/lib/sanitize-user";
import { User } from "@/models/User";
import type { ApiResponse } from "@/types";
import { decode } from "next-auth/jwt";

export const dynamic = "force-dynamic";

type FollowBody = {
  userId?: string;
};

export async function POST(req: Request): Promise<Response> {
  await connectDB();

  let bodyJson: FollowBody;
  try {
    bodyJson = (await req.json()) as FollowBody;
  } catch {
    const body: ApiResponse = { ok: false, error: "Invalid JSON body" };
    return Response.json(body, { status: 400 });
  }

  const userId = bodyJson.userId?.trim();
  if (!userId) {
    const body: ApiResponse = { ok: false, error: "Missing userId" };
    return Response.json(body, { status: 400 });
  }

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  if (!token) {
    const body: ApiResponse = { ok: false, error: "Missing Bearer token" };
    return Response.json(body, { status: 401 });
  }

  const secret = process.env.NEXTAUTH_SECRET ?? "dev-secret";
  const decoded = await decode({
    secret,
    salt: "register",
    token,
  });

  const decodedSub = (decoded as any)?.sub ?? (decoded as any)?.token?.sub;
  if (!decodedSub || String(decodedSub) !== userId) {
    const body: ApiResponse = { ok: false, error: "Invalid token" };
    return Response.json(body, { status: 401 });
  }

  const user = await User.findById(userId).exec();
  if (!user) {
    const body: ApiResponse = { ok: false, error: "User not found" };
    return Response.json(body, { status: 404 });
  }

  const now = new Date();
  user.social.linkedin.verified = true;
  user.social.linkedin.verifiedAt = now;
  user.social.instagram.verified = true;
  user.social.instagram.verifiedAt = now;

  user.funnel.currentStep = 3;
  const nextCompleted = new Set<number>(user.funnel.completedSteps ?? []);
  nextCompleted.add(2);
  user.funnel.completedSteps = Array.from(nextCompleted).sort((a, b) => a - b);

  user.points = (user.points ?? 0) + 10;

  await user.save();

  const updatedUser = sanitizeUser(user.toObject());
  const body: ApiResponse = { ok: true, data: updatedUser };
  return Response.json(body, { status: 200 });
}

