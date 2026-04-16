import axios from "axios";

import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

type Platform = "google" | "linkedin" | "instagram";
type VerifyBody = {
  userId?: string;
  platform?: Platform;
  accessToken?: string;
};

async function verifyWithPlatform(platform: Platform, accessToken?: string) {
  if (platform === "google") return true;

  if (!accessToken) return false;

  if (platform === "linkedin") {
    const res = await axios.get("https://api.linkedin.com/v2/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
      validateStatus: () => true,
    });
    return res.status >= 200 && res.status < 300;
  }

  const res = await axios.get("https://graph.instagram.com/me?fields=id,username", {
    params: { access_token: accessToken },
    validateStatus: () => true,
  });
  return res.status >= 200 && res.status < 300;
}

export async function POST(req: Request): Promise<Response> {
  await connectDB();

  let bodyJson: VerifyBody;
  try {
    bodyJson = (await req.json()) as VerifyBody;
  } catch {
    const body: ApiResponse = { ok: false, error: "Invalid JSON body" };
    return Response.json(body, { status: 400 });
  }

  const userId = bodyJson.userId;
  const platform = bodyJson.platform;
  const accessToken = bodyJson.accessToken;

  if (!userId || !platform) {
    const body: ApiResponse = { ok: false, error: "Missing userId/platform" };
    return Response.json(body, { status: 400 });
  }

  const ok = await verifyWithPlatform(platform, accessToken);
  if (!ok) {
    const body: ApiResponse = { ok: false, error: "Verification failed" };
    return Response.json(body, { status: 401 });
  }

  const user = await User.findById(userId).exec();
  if (!user) {
    const body: ApiResponse = { ok: false, error: "User not found" };
    return Response.json(body, { status: 404 });
  }

  const now = new Date();
  if (platform === "google") {
    user.social.google.verified = true;
    user.social.google.verifiedAt = now;
  } else if (platform === "linkedin") {
    user.social.linkedin.verified = true;
    user.social.linkedin.verifiedAt = now;
    if (accessToken) user.social.linkedin.accessToken = accessToken;
  } else {
    user.social.instagram.verified = true;
    user.social.instagram.verifiedAt = now;
    if (accessToken) user.social.instagram.accessToken = accessToken;
  }

  const allCompleted =
    user.social.google.verified &&
    user.social.linkedin.verified &&
    user.social.instagram.verified;

  if (allCompleted) {
    // Social actions completed -> HR contact step
    user.funnel.currentStep = 7;
  }

  await user.save();

  const body: ApiResponse = {
    ok: true,
    data: { verified: true, allCompleted },
  };
  return Response.json(body, { status: 200 });
}

