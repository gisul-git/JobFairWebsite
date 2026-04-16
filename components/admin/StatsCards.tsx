"use client";

import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

export default function StatsCards() {
  const { data: session } = useSession();
  const adminId = (session?.user as any)?.id as string | undefined;

  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [certificatesIssued, setCertificatesIssued] = useState(0);
  const [luckyDrawEntries, setLuckyDrawEntries] = useState(0);
  const [stepDistribution, setStepDistribution] = useState<Array<{ step: number; count: number }>>([]);

  useEffect(() => {
    if (!adminId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/users?page=1&limit=1", {
          headers: { "x-user-id": adminId },
        });
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
  }, [adminId]);

  const funnelCompletionRate = useMemo(() => {
    const step1 = stepDistribution.find((s) => s.step === 1)?.count ?? total;
    const step7 = stepDistribution.find((s) => s.step === 7)?.count ?? 0;
    if (!step1) return 0;
    return Math.round((step7 / step1) * 100);
  }, [stepDistribution, total]);

  const cards = [
    { label: "Total Registrations", value: total.toLocaleString() },
    { label: "Certificates Issued", value: certificatesIssued.toLocaleString() },
    { label: "Funnel Completion Rate", value: `${funnelCompletionRate}%` },
    { label: "Lucky Draw Entries", value: luckyDrawEntries.toLocaleString() },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-secondary/40 bg-secondary/20 p-5"
        >
          <div className="text-sm font-semibold text-cream/80">{c.label}</div>
          <div className="mt-2 text-3xl font-extrabold text-white">
            {loading ? "…" : c.value}
          </div>
        </motion.div>
      ))}
    </section>
  );
}

