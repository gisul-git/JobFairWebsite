import { connectDB } from "@/lib/mongodb";
import { getPointsForStep } from "@/lib/points";
import { sanitizeUser } from "@/lib/sanitize-user";
import { User } from "@/models/User";
import type { ApiResponse } from "@/types";
import { encode } from "next-auth/jwt";

export const dynamic = "force-dynamic";

type RegisterBody = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  collegeOrCompany?: string;
};

export async function POST(req: Request): Promise<Response> {
  await connectDB();

  let bodyJson: RegisterBody;
  try {
    bodyJson = (await req.json()) as RegisterBody;
  } catch {
    const body: ApiResponse = { ok: false, error: "Invalid JSON body" };
    return Response.json(body, { status: 400 });
  }

  const name = bodyJson.name?.trim();
  const email = bodyJson.email?.trim().toLowerCase();
  const phone = bodyJson.phone?.trim();
  const address = bodyJson.address?.trim();
  const collegeOrCompany = bodyJson.collegeOrCompany?.trim();

  if (!name || !email || !phone || !address || !collegeOrCompany) {
    const body: ApiResponse = { ok: false, error: "Missing required fields" };
    return Response.json(body, { status: 400 });
  }

  const existing = await User.findOne({ email }).lean();
  if (existing) {
    const secret = process.env.NEXTAUTH_SECRET ?? "dev-secret";
    const sessionToken = await encode({
      secret,
      salt: "register",
      token: { sub: String((existing as any)._id), email: existing.email },
    });

    return Response.json(
      {
        ok: true,
        user: sanitizeUser(existing),
        data: sanitizeUser(existing),
        sessionToken,
      },
      { status: 200 }
    );
  }

  const created = await User.create({
    name,
    email,
    phone,
    address,
    collegeOrCompany,
    funnel: { currentStep: 2, completedSteps: [1] },
    points: getPointsForStep(2),
  });

  const user = sanitizeUser(created.toObject()) as any;

  const secret = process.env.NEXTAUTH_SECRET ?? "dev-secret";
  const sessionToken = await encode({
    secret,
    salt: "register",
    token: { sub: String(created._id), email: created.email },
  });

  return Response.json(
    {
      ok: true,
      success: true,
      user,
      data: user,
      sessionToken,
    },
    { status: 201 }
  );
}

