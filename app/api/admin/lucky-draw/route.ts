import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/admin";
import type { ApiResponse } from "@/types";
import { User } from "@/models/User";

export const dynamic = "force-dynamic";

type LuckyDrawBody = {
  numberOfWinners?: number;
  prizes?: string[];
};

function pickWeightedUnique<T>(items: T[], weights: number[], k: number) {
  const selected: T[] = [];
  const poolItems = [...items];
  const poolWeights = [...weights];

  while (selected.length < k && poolItems.length > 0) {
    const total = poolWeights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (; idx < poolWeights.length; idx++) {
      r -= poolWeights[idx];
      if (r <= 0) break;
    }
    const [it] = poolItems.splice(idx, 1);
    poolWeights.splice(idx, 1);
    selected.push(it);
  }

  return selected;
}

export async function POST(req: Request): Promise<Response> {
  await connectDB();

  const admin = await requireAdmin(req);
  if (!admin.ok) {
    const body: ApiResponse = { ok: false, error: admin.error };
    return Response.json(body, { status: admin.status });
  }

  let bodyJson: LuckyDrawBody;
  try {
    bodyJson = (await req.json()) as LuckyDrawBody;
  } catch {
    const body: ApiResponse = { ok: false, error: "Invalid JSON body" };
    return Response.json(body, { status: 400 });
  }

  const numberOfWinners = Math.max(1, Math.floor(bodyJson.numberOfWinners ?? 1));
  const prizes = Array.isArray(bodyJson.prizes) ? bodyJson.prizes : [];

  const eligible = await User.find({
    "luckyDraw.eligible": true,
    "luckyDraw.isWinner": false,
  }).exec();

  const weights = eligible.map((u) => Math.max(1, u.luckyDraw.entries ?? 1));
  const winners = pickWeightedUnique(eligible, weights, numberOfWinners);

  const updated = [];
  for (let i = 0; i < winners.length; i++) {
    const u = winners[i];
    u.luckyDraw.isWinner = true;
    u.luckyDraw.prize = prizes[i] ?? u.luckyDraw.prize;
    await u.save();
    updated.push({
      id: u.id,
      name: u.name,
      email: u.email,
      prize: u.luckyDraw.prize ?? null,
      entries: u.luckyDraw.entries,
    });
  }

  const body: ApiResponse = { ok: true, data: { winners: updated } };
  return Response.json(body, { status: 200 });
}

