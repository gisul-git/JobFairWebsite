import { decode } from "next-auth/jwt";

import { BDE_QUESTIONS, BDE_TOTAL_QUESTIONS } from "@/lib/questions/bde-questions";
import { connectDB } from "@/lib/mongodb";
import { sanitizeUser } from "@/lib/sanitize-user";
import { User } from "@/models/User";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

type SubmitBody = {
  answers?: number[];
  role?: string;
  timeTaken?: number;
  githubUrl?: string;
  deployedUrl?: string;
  notes?: string;
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

  let bodyJson: SubmitBody;
  try {
    bodyJson = (await req.json()) as SubmitBody;
  } catch {
    const body: ApiResponse = { ok: false, error: "Invalid JSON body" };
    return Response.json(body, { status: 400 });
  }

  const role = bodyJson.role === "BDE" || bodyJson.role === "Fullstack" ? bodyJson.role : null;
  if (!role) {
    const body: ApiResponse = { ok: false, error: "Missing assessment payload" };
    return Response.json(body, { status: 400 });
  }

  const user = await User.findById(userId).exec();
  if (!user) {
    const body: ApiResponse = { ok: false, error: "User not found" };
    return Response.json(body, { status: 404 });
  }

  if (role === "Fullstack") {
    const githubUrl = String(bodyJson.githubUrl ?? "").trim();
    const deployedUrl = String(bodyJson.deployedUrl ?? "").trim();
    const notes = String(bodyJson.notes ?? "").trim();
    if (!githubUrl.startsWith("https://github.com/")) {
      const body: ApiResponse = { ok: false, error: "Please enter a valid GitHub URL" };
      return Response.json(body, { status: 400 });
    }
    if (!deployedUrl.startsWith("https://")) {
      const body: ApiResponse = { ok: false, error: "Please enter a valid deployed URL" };
      return Response.json(body, { status: 400 });
    }

    user.assessment = {
      role,
      answers: [],
      answersInProgress: new Map<string, number>(),
      lastQuestionIndex: 0,
      score: null as any,
      correctCount: null as any,
      totalQuestions: null as any,
      timeTaken: null as any,
      githubUrl,
      deployedUrl,
      notes: notes || "",
      startedAt: user.assessment?.startedAt ?? new Date(),
      submittedAt: new Date(),
      completed: true,
    };
  } else {
    const answers = Array.isArray(bodyJson.answers) ? bodyJson.answers.map((v) => Number(v)) : null;
    const timeTaken = typeof bodyJson.timeTaken === "number" ? bodyJson.timeTaken : null;
    if (!answers || timeTaken === null) {
      const body: ApiResponse = { ok: false, error: "Missing assessment payload" };
      return Response.json(body, { status: 400 });
    }

    const questionSet = BDE_QUESTIONS;
    const totalQuestions = BDE_TOTAL_QUESTIONS;
    let correctCount = 0;
    questionSet.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) correctCount += 1;
    });
    const score = Math.round((correctCount / totalQuestions) * 100);

    user.assessment = {
      role,
      answers,
      answersInProgress: new Map<string, number>(),
      lastQuestionIndex: 0,
      score,
      correctCount,
      totalQuestions,
      timeTaken,
      githubUrl: null as any,
      deployedUrl: null as any,
      notes: null as any,
      startedAt: user.assessment?.startedAt ?? new Date(),
      submittedAt: new Date(),
      completed: true,
    };
  }

  user.funnel.currentStep = 7;
  const nextCompleted = new Set<number>(user.funnel.completedSteps ?? []);
  nextCompleted.add(6);
  user.funnel.completedSteps = Array.from(nextCompleted).sort((a, b) => a - b);
  user.points = (user.points ?? 0) + 20;

  await user.save();

  const updatedUser = sanitizeUser(user.toObject());
  const body: ApiResponse = { ok: true, data: updatedUser };
  return Response.json(body, { status: 200 });
}

