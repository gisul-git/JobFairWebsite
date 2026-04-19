import { decode } from "next-auth/jwt";
import { nanoid } from "nanoid";

import { connectDB } from "@/lib/mongodb";
import { uploadToBlob } from "@/lib/azure-blob";
import { publicSiteOriginFromRequest } from "@/lib/public-site-url";
import { User } from "@/models/User";
import type { ApiResponse } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getBearerToken(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice("Bearer ".length);
}

type Body = {
  imageBase64?: string;
};

export async function POST(req: Request): Promise<Response> {
  try {
    await connectDB();

    const token = getBearerToken(req);
    if (!token) {
      const body: ApiResponse = { ok: false, error: "Missing Bearer token" };
      return Response.json(body, { status: 401 });
    }

    const secret = process.env.NEXTAUTH_SECRET ?? "dev-secret";
    const decoded = await decode({ secret, salt: "register", token });
    const userId = String((decoded as any)?.sub ?? (decoded as any)?.token?.sub ?? "").trim();
    if (!userId) {
      const body: ApiResponse = { ok: false, error: "Invalid token" };
      return Response.json(body, { status: 401 });
    }

    let bodyJson: Body;
    try {
      bodyJson = (await req.json()) as Body;
    } catch {
      const body: ApiResponse = { ok: false, error: "Invalid JSON body" };
      return Response.json(body, { status: 400 });
    }

    const raw = bodyJson.imageBase64?.replace(/^data:image\/png;base64,/, "").trim() ?? "";
    if (!raw) {
      const body: ApiResponse = { ok: false, error: "Missing certificate image" };
      return Response.json(body, { status: 400 });
    }

    const buffer = Buffer.from(raw, "base64");
    if (buffer.length < 500 || buffer.length > 12 * 1024 * 1024) {
      const body: ApiResponse = { ok: false, error: "Invalid image size" };
      return Response.json(body, { status: 400 });
    }

    const user = await User.findById(userId);
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

    const slug = user.certificate?.shareSlug?.trim() || nanoid(20);
    const blobName = `cert-share/${slug}.png`;

    await uploadToBlob(buffer, blobName);

    (user.certificate as any).shareSlug = slug;
    await user.save();

    const origin = publicSiteOriginFromRequest(req).replace(/\/$/, "");
    if (!origin) {
      const body: ApiResponse = {
        ok: false,
        error: "Public site URL is not configured. Set NEXT_PUBLIC_APP_URL on the server (e.g. https://jobfair.gisul.co.in).",
      };
      return Response.json(body, { status: 500 });
    }
    const shareUrl = `${origin}/share/certificate/${slug}`;

    const body: ApiResponse = {
      ok: true,
      data: { shareUrl, shareSlug: slug },
    };
    return Response.json(body, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save share preview";
    const body: ApiResponse = { ok: false, error: message };
    return Response.json(body, { status: 500 });
  }
}
