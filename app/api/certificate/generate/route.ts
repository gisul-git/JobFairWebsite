import { nanoid } from "nanoid";

import { connectDB } from "@/lib/mongodb";
import { getPointsForStep } from "@/lib/points";
import { uploadToBlob } from "@/lib/azure-blob";
import { generateCertificate } from "@/lib/certificate-generator";
import { User } from "@/models/User";
import type { ApiResponse } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GenerateBody = {
  userId?: string;
};

export async function POST(_req: Request): Promise<Response> {
  await connectDB();

  let bodyJson: GenerateBody;
  try {
    bodyJson = (await _req.json()) as GenerateBody;
  } catch {
    const body: ApiResponse = { ok: false, error: "Invalid JSON body" };
    return Response.json(body, { status: 400 });
  }

  const userId = bodyJson.userId;
  if (!userId) {
    const body: ApiResponse = { ok: false, error: "Missing userId" };
    return Response.json(body, { status: 400 });
  }

  const user = await User.findById(userId).exec();
  if (!user) {
    const body: ApiResponse = { ok: false, error: "User not found" };
    return Response.json(body, { status: 404 });
  }

  const aiDone = Boolean(user.courses?.aiFundamentals?.completed);
  const softDone = Boolean(user.courses?.softSkills?.completed);
  if (!aiDone || !softDone) {
    const body: ApiResponse = { ok: false, error: "Courses not completed" };
    return Response.json(body, { status: 400 });
  }

  const certificateId = nanoid(12);
  const pdf = await generateCertificate({ ...(user.toObject() as any), certificateId });
  const filename = `gisul-certificate-${user.id}-${certificateId}.pdf`;
  const blobUrl = await uploadToBlob(pdf, filename);

  user.certificate.issued = true;
  user.certificate.issuedAt = new Date();
  user.certificate.blobUrl = blobUrl;
  user.funnel.currentStep = 6;
  if (!user.funnel.completedSteps.includes(5)) {
    user.funnel.completedSteps.push(5);
  }
  user.points = getPointsForStep(6);
  await user.save();

  const body: ApiResponse = {
    ok: true,
    data: { blobUrl, certificateId },
  };
  return Response.json(body, { status: 200 });
}

