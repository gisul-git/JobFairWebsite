import { getReadSasForBlobUrl } from "@/lib/azure-blob";
import { requireAdmin } from "@/lib/admin";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const admin = await requireAdmin(req);
  if (!admin.ok) {
    const body: ApiResponse = { ok: false, error: admin.error };
    return Response.json(body, { status: admin.status });
  }

  const sourceUrl = new URL(req.url).searchParams.get("url")?.trim();
  if (!sourceUrl) {
    const body: ApiResponse = { ok: false, error: "Missing url" };
    return Response.json(body, { status: 400 });
  }

  try {
    const sasUrl = await getReadSasForBlobUrl(sourceUrl);
    if (!sasUrl) {
      const body: ApiResponse = { ok: false, error: "Invalid resume URL" };
      return Response.json(body, { status: 400 });
    }
    return Response.redirect(sasUrl, 302);
  } catch (e) {
    const body: ApiResponse = {
      ok: false,
      error: e instanceof Error ? e.message : "Could not sign URL",
    };
    return Response.json(body, { status: 500 });
  }
}
