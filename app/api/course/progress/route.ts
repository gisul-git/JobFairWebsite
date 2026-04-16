import { connectDB } from "@/lib/mongodb";
import { sanitizeUser } from "@/lib/sanitize-user";
import { User } from "@/models/User";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

type CourseKey = "aiFundamentals" | "softSkills";

type ProgressBody = {
  userId?: string;
  courseKey?: CourseKey;
  progressPercent?: number;
  watchedSeconds?: number;
};

async function triggerCertificateGeneration(userId: string) {
  const base =
    process.env.APP_URL ??
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL;

  if (!base) return;

  await fetch(new URL("/api/certificate/generate", base), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userId }),
  });
}

export async function POST(req: Request): Promise<Response> {
  await connectDB();

  let bodyJson: ProgressBody;
  try {
    bodyJson = (await req.json()) as ProgressBody;
  } catch {
    const body: ApiResponse = { ok: false, error: "Invalid JSON body" };
    return Response.json(body, { status: 400 });
  }

  const userId = bodyJson.userId;
  const courseKey = bodyJson.courseKey;
  const progressPercent = bodyJson.progressPercent;
  const watchedSeconds = bodyJson.watchedSeconds;

  if (!userId || !courseKey) {
    const body: ApiResponse = { ok: false, error: "Missing userId/courseKey" };
    return Response.json(body, { status: 400 });
  }

  if (typeof progressPercent !== "number" || typeof watchedSeconds !== "number") {
    const body: ApiResponse = {
      ok: false,
      error: "progressPercent and watchedSeconds must be numbers",
    };
    return Response.json(body, { status: 400 });
  }

  const now = new Date();

  const $set: Record<string, unknown> = {
    [`courses.${courseKey}.progressPercent`]: Math.max(0, Math.min(100, progressPercent)),
    [`courses.${courseKey}.watchedSeconds`]: Math.max(0, watchedSeconds),
    [`courses.${courseKey}.started`]: now,
  };

  if (progressPercent >= 100) {
    $set[`courses.${courseKey}.completed`] = now;
  }

  let user = await User.findByIdAndUpdate(userId, { $set }, { new: true }).exec();
  if (!user) {
    const body: ApiResponse = { ok: false, error: "User not found" };
    return Response.json(body, { status: 404 });
  }

  const aiDone = Boolean(user.courses?.aiFundamentals?.completed);
  const softDone = Boolean(user.courses?.softSkills?.completed);

  if (aiDone && softDone) {
    // Video learning completed -> certificate step
    user.funnel.currentStep = 5;
    if (!user.funnel.completedSteps.includes(4)) {
      user.funnel.completedSteps.push(4);
    }
    user.luckyDraw.eligible = true;
    await user.save();

    void triggerCertificateGeneration(user.id);
  }

  const body: ApiResponse = { ok: true, data: sanitizeUser(user.toObject()) };
  return Response.json(body, { status: 200 });
}

