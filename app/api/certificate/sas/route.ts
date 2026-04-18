import { getReadSasForBlobUrl } from "@/lib/azure-blob";
import type { ApiResponse } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url).searchParams.get("url");
  if (!url?.trim()) {
    const body: ApiResponse = { ok: false, error: "Missing url" };
    return Response.json(body, { status: 400 });
  }

  try {
    const sasUrl = await getReadSasForBlobUrl(url.trim());
    if (!sasUrl) {
      const body: ApiResponse = { ok: false, error: "Invalid certificate URL" };
      return Response.json(body, { status: 400 });
    }
    const body: ApiResponse = { ok: true, data: { url: sasUrl } };
    return Response.json(body, { status: 200 });
  } catch (e) {
    const body: ApiResponse = {
      ok: false,
      error: e instanceof Error ? e.message : "Could not sign URL",
    };
    return Response.json(body, { status: 500 });
  }
}
