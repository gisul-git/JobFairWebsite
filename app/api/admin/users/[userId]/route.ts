import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin";
import { deleteBlobByUrl } from "@/lib/azure-blob";
import { User } from "@/models/User";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: Request,
  ctx: { params: { userId: string } }
): Promise<Response> {
  await connectDB();

  const admin = await requireAdmin(req);
  if (!admin.ok) {
    const body: ApiResponse = { ok: false, error: admin.error };
    return Response.json(body, { status: admin.status });
  }

  const userId = String(ctx.params.userId ?? "").trim();
  if (!userId) {
    const body: ApiResponse = { ok: false, error: "Missing userId" };
    return Response.json(body, { status: 400 });
  }

  const user = await User.findById(userId).exec();
  if (!user) {
    const body: ApiResponse = { ok: false, error: "User not found" };
    return Response.json(body, { status: 404 });
  }

  if (user.isAdmin) {
    const body: ApiResponse = { ok: false, error: "Cannot delete admin user" };
    return Response.json(body, { status: 400 });
  }

  const resumeBlobUrl = user.resume?.blobUrl ?? null;
  const certificateBlobUrl = user.certificate?.blobUrl ?? null;

  await User.deleteOne({ _id: userId }).exec();

  const cleanupTasks = [resumeBlobUrl, certificateBlobUrl]
    .filter((u): u is string => Boolean(u))
    .map(async (blobUrl) => {
      try {
        await deleteBlobByUrl(blobUrl);
        return { blobUrl, ok: true as const };
      } catch {
        return { blobUrl, ok: false as const };
      }
    });

  const cleanupResults = await Promise.all(cleanupTasks);
  const cleanupFailed = cleanupResults
    .filter((x) => !x.ok)
    .map((x) => x.blobUrl);

  const body: ApiResponse = {
    ok: true,
    data: {
      deletedUserId: userId,
      cleanedBlobCount: cleanupResults.length - cleanupFailed.length,
      cleanupFailedCount: cleanupFailed.length,
    },
  };
  return Response.json(body, { status: 200 });
}

