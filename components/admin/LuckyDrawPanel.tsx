"use client";

import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";

export default function LuckyDrawPanel() {
  const { data: session } = useSession();
  const adminId = (session?.user as any)?.id as string | undefined;

  const [numberOfWinners, setNumberOfWinners] = useState(3);
  const [prizes, setPrizes] = useState<string[]>(["Free Goodies", "Course Scholarship Voucher", "Internship Fast-Track"]);
  const [loading, setLoading] = useState(false);
  const [winners, setWinners] = useState<Array<{ id: string; name: string; email: string; prize: string | null }>>([]);

  const canRun = useMemo(() => numberOfWinners > 0 && prizes.length >= numberOfWinners, [numberOfWinners, prizes.length]);

  function downloadCsv(filename: string, lines: string[]) {
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function csvEscape(v: any) {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
    return s;
  }

  function exportWinners() {
    const headers = ["Name", "Email", "Prize"];
    const lines = [headers.join(",")];
    for (const w of winners) {
      lines.push([csvEscape(w.name), csvEscape(w.email), csvEscape(w.prize ?? "")].join(","));
    }
    downloadCsv("lucky-draw-winners.csv", lines);
  }

  async function runLuckyDraw() {
    if (!adminId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/lucky-draw", {
        method: "POST",
        headers: { "content-type": "application/json", "x-user-id": adminId },
        body: JSON.stringify({ numberOfWinners, prizes }),
      });
      const json = (await res.json()) as any;
      if (res.ok && json?.ok) {
        setWinners(json.data?.winners ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="text-xl font-extrabold text-white">Lucky Draw</div>
      <div className="mt-1 text-sm text-cream/80">Run weighted winners selection and export results.</div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-secondary/40 bg-secondary/10 p-4">
          <div className="text-sm font-semibold text-cream/80">Number of winners</div>
          <input
            value={numberOfWinners}
            onChange={(e) => setNumberOfWinners(Math.max(1, Number(e.target.value) || 1))}
            type="number"
            className="mt-2 w-full rounded-xl border border-cream/20 bg-transparent px-4 py-2 text-white outline-none focus:border-primary"
          />
        </div>

        <div className="md:col-span-2 rounded-xl border border-secondary/40 bg-secondary/10 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-cream/80">Prizes</div>
            <button
              type="button"
              onClick={() => setPrizes((p) => [...p, "New Prize"])}
              className="rounded-full border border-cream/20 bg-white/5 px-4 py-1.5 text-xs font-bold text-white"
            >
              + Add
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {prizes.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  value={p}
                  onChange={(e) =>
                    setPrizes((prev) => prev.map((x, i) => (i === idx ? e.target.value : x)))
                  }
                  className="flex-1 rounded-xl border border-cream/20 bg-transparent px-4 py-2 text-white outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setPrizes((prev) => prev.filter((_, i) => i !== idx))}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/90"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          {!canRun ? (
            <p className="mt-2 text-xs text-cream/70">Add at least as many prizes as winners.</p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <motion.button
          type="button"
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.99 }}
          disabled={!canRun || loading}
          onClick={() => void runLuckyDraw()}
          className="rounded-full bg-primary px-8 py-3 font-bold text-dark disabled:opacity-60"
        >
          {loading ? "Running…" : "Run Lucky Draw"}
        </motion.button>
        <button
          type="button"
          onClick={exportWinners}
          disabled={winners.length === 0}
          className="rounded-full border border-primary/40 bg-primary/10 px-8 py-3 font-bold text-primary disabled:opacity-50"
        >
          Export Winners
        </button>
      </div>

      <div className="mt-6">
        <div className="text-sm font-semibold text-cream/80">Winners</div>
        <div className="mt-3 space-y-2">
          {winners.length === 0 ? (
            <div className="text-sm text-cream/70">No winners yet.</div>
          ) : (
            winners.map((w) => (
              <div
                key={w.id}
                className="flex flex-col gap-1 rounded-xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-bold text-white">{w.name}</div>
                  <div className="text-sm text-cream/80">{w.email}</div>
                </div>
                <div className="mt-2 rounded-full border border-secondary/40 bg-secondary/10 px-4 py-2 text-sm font-bold text-white sm:mt-0">
                  {w.prize ?? "—"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

