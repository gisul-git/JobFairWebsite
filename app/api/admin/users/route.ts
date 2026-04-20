import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin";
import { sanitizeUser } from "@/lib/sanitize-user";
import { User } from "@/models/User";
import type { ApiResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(_req: Request): Promise<Response> {
  await connectDB();

  const admin = await requireAdmin(_req);
  if (!admin.ok) {
    const body: ApiResponse = { ok: false, error: admin.error };
    return Response.json(body, { status: admin.status });
  }

  const url = new URL(_req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const limit = Math.min(
    200,
    Math.max(1, Number(url.searchParams.get("limit") ?? "20") || 20)
  );
  const search = url.searchParams.get("search")?.trim();
  const stepRaw = url.searchParams.get("step")?.trim();
  const step = stepRaw ? Number(stepRaw) : undefined;
  const roleRaw = url.searchParams.get("role")?.trim();
  const role = roleRaw === "BDE" || roleRaw === "Fullstack" ? roleRaw : undefined;

  const filter: Record<string, unknown> = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  if (typeof step === "number" && !Number.isNaN(step)) {
    filter["funnel.currentStep"] = step;
  }
  if (role) {
    filter["role"] = role;
  }

  const [users, total, stepDistribution] = await Promise.all([
    User.find(filter)
      .sort({ registeredAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
    User.aggregate([
      { $match: filter },
      { $group: { _id: "$funnel.currentStep", count: { $sum: 1 } } },
      { $project: { _id: 0, step: "$_id", count: 1 } },
      { $sort: { step: 1 } },
    ]),
  ]);

  const [certificatesIssued, luckyDrawEntries] = await Promise.all([
    User.countDocuments({ ...filter, "certificate.issued": true }),
    User.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: "$luckyDraw.entries" } } },
      { $project: { _id: 0, total: 1 } },
    ]),
  ]);

  const body: ApiResponse = {
    ok: true,
    data: {
      users: users.map((u) => sanitizeUser(u)),
      total,
      stepDistribution,
      certificatesIssued,
      luckyDrawEntries: luckyDrawEntries?.[0]?.total ?? 0,
      page,
      limit,
    },
  };
  return Response.json(body, { status: 200 });
}

