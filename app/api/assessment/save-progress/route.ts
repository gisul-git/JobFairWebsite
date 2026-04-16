import { decode } from "next-auth/jwt";

import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

type SaveProgressBody = {
  currentQuestion?: number;
  answers?: Record<string, number>;
};

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

  let bodyJson: SaveProgressBody;
  try {
    bodyJson = (await req.json()) as SaveProgressBody;
  } catch {
    const body: ApiResponse = { ok: false, error: "Invalid JSON body" };
    return Response.json(body, { status: 400 });
  }

  const currentQuestion =
    typeof bodyJson.currentQuestion === "number" ? Math.max(0, bodyJson.currentQuestion) : null;
  const answers =
    bodyJson.answers && typeof bodyJson.answers === "object" ? Object.entries(bodyJson.answers) : null;

  if (currentQuestion === null || !answers) {
    const body: ApiResponse = { ok: false, error: "Missing assessment progress payload" };
    return Response.json(body, { status: 400 });
  }

  const normalizedAnswers = Object.fromEntries(
    answers.map(([key, value]) => [key, Number(value)]).filter(([, value]) => Number.isFinite(value))
  );

  const user = await User.findById(userId).exec();
  if (!user) {
    const body: ApiResponse = { ok: false, error: "User not found" };
    return Response.json(body, { status: 404 });
  }

  user.assessment.answersInProgress = normalizedAnswers as any;
  user.assessment.lastQuestionIndex = currentQuestion;
  if (!user.assessment.startedAt) {
    user.assessment.startedAt = new Date();
  }
  await user.save();

  return Response.json({ ok: true, saved: true }, { status: 200 });
}
