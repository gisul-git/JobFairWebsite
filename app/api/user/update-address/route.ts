import { decode } from "next-auth/jwt";

import { connectDB } from "@/lib/mongodb";
import { sanitizeUser } from "@/lib/sanitize-user";
import { User } from "@/models/User";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

type UpdateAddressBody = {
  fullAddress?: string;
  city?: string;
  pincode?: string;
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

  let bodyJson: UpdateAddressBody;
  try {
    bodyJson = (await req.json()) as UpdateAddressBody;
  } catch {
    const body: ApiResponse = { ok: false, error: "Invalid JSON body" };
    return Response.json(body, { status: 400 });
  }

  const fullAddress = bodyJson.fullAddress?.trim() ?? "";
  const city = bodyJson.city?.trim() ?? "";
  const pincode = String(bodyJson.pincode ?? "").trim();

  if (!fullAddress) {
    const body: ApiResponse = { ok: false, error: "Full address is required" };
    return Response.json(body, { status: 400 });
  }
  if (!/^\d{6}$/.test(pincode)) {
    const body: ApiResponse = { ok: false, error: "Pincode must be exactly 6 digits" };
    return Response.json(body, { status: 400 });
  }

  const combinedAddress = city
    ? `${fullAddress}, ${city} - ${pincode}`
    : `${fullAddress} - ${pincode}`;

  const user = await User.findById(userId).exec();
  if (!user) {
    const body: ApiResponse = { ok: false, error: "User not found" };
    return Response.json(body, { status: 404 });
  }

  user.address = combinedAddress;
  await user.save();

  const updatedUser = sanitizeUser(user.toObject());
  return Response.json(
    {
      ok: true,
      success: true,
      data: updatedUser,
    },
    { status: 200 }
  );
}

