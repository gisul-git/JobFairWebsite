"use client";

import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

export default function StatsCards() {
  const { data: session } = useSession();
  const isAdmin = Boolean((session?.user as any)?.isAdmin);

  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [certificatesIssued, setCertificatesIssued] = useState(0);
  const [luckyDrawEntries, setLuckyDrawEntries] = useState(0);
  const [stepDistribution, setStepDistribution] = useState<Array<{ step: number; count: number }>>([]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/users?page=1&limit=1");
        const json = (await res.json()) as any;
        if (!res.ok || !json?.ok) return;
        if (cancelled) return;

        setTotal(Number(json.data?.total ?? 0));
        setCertificatesIssued(Number(json.data?.certificatesIssued ?? 0));
        setLuckyDrawEntries(Number(json.data?.luckyDrawEntries ?? 0));
        setStepDistribution(json.data?.stepDistribution ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const funnelCompletionRate = useMemo(() => {
    const step1 = stepDistribution.find((s) => s.step === 1)?.count ?? total;
    const step7 = stepDistribution.find((s) => s.step === 7)?.count ?? 0;
    if (!step1) return 0;
    return Math.round((step7 / step1) * 100);
  }, [stepDistribution, total]);

  const cards = [
    { label: "Total Registrations", value: total.toLocaleString(), tone: "from-[#6952a2]/35 to-transparent" },
    { label: "Certificates Issued", value: certificatesIssued.toLocaleString(), tone: "from-[#4f7cff]/25 to-transparent" },
    { label: "Funnel Completion Rate", value: `${funnelCompletionRate}%`, tone: "from-[#f4e401]/20 to-transparent" },
    { label: "Lucky Draw Entries", value: luckyDrawEntries.toLocaleString(), tone: "from-[#a855f7]/25 to-transparent" },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#11162a]/85 p-5"
        >
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${c.tone}`} />
          <div className="relative text-xs font-semibold uppercase tracking-[0.12em] text-cream/70">{c.label}</div>
          <div className="relative mt-3 text-3xl font-black text-white">
            {loading ? "…" : c.value}
          </div>
        </motion.div>
      ))}
    </section>
  );
}

