import { connectDB } from "@/lib/mongodb";
import { sanitizeUser } from "@/lib/sanitize-user";
import { User } from "@/models/User";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

type RegisterBody = {
  name?: string;
  email?: string;
  phone?: string;
  collegeOrCompany?: string;
  referralCode?: string;
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
  const collegeOrCompany = bodyJson.collegeOrCompany?.trim();
  const referralCode = bodyJson.referralCode?.trim() || undefined;

  if (!name || !email || !phone || !collegeOrCompany) {
    const body: ApiResponse = { ok: false, error: "Missing required fields" };
    return Response.json(body, { status: 400 });
  }

  const existing = await User.findOne({ email }).lean();
  if (existing) {
    const body: ApiResponse = { ok: true, data: sanitizeUser(existing) };
    return Response.json(body, { status: 200 });
  }

  let referredBy: string | null = null;
  if (referralCode) {
    const referrer = await User.findOne({ referralCode }).exec();
    if (referrer) {
      referredBy = referralCode;
      referrer.referralCount = (referrer.referralCount ?? 0) + 1;
      referrer.luckyDraw.entries = (referrer.luckyDraw?.entries ?? 1) + 1;
      await referrer.save();
    }
  }

  const created = await User.create({
    name,
    email,
    phone,
    collegeOrCompany,
    referredBy,
  });

  const body: ApiResponse = { ok: true, data: sanitizeUser(created.toObject()) };
  return Response.json(body, { status: 201 });
}

