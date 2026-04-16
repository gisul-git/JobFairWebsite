"use client";

import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

export default function UsersTable() {
  const { data: session } = useSession();
  const adminId = (session?.user as any)?.id as string | undefined;

  const [search, setSearch] = useState("");
  const [step, setStep] = useState<string>("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("limit", String(limit));
    if (search.trim()) p.set("search", search.trim());
    if (step) p.set("step", step);
    return p.toString();
  }, [page, search, step]);

  useEffect(() => {
    if (!adminId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/users?${query}`, {
          headers: { "x-user-id": adminId },
        });
        const json = (await res.json()) as any;
        if (!res.ok || !json?.ok) return;
        if (cancelled) return;
        setRows(json.data?.users ?? []);
        setTotal(Number(json.data?.total ?? 0));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adminId, query]);

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

  function exportCsv() {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "College/Company",
      "Step",
      "Courses Done",
      "Certificate",
      "Social Done",
      "Registered At",
      "Referrals",
    ];

    const lines = [headers.join(",")];
    for (const u of rows) {
      const coursesDone =
        Number(u?.courses?.aiFundamentals?.progressPercent ?? 0) >= 100 &&
        Number(u?.courses?.softSkills?.progressPercent ?? 0) >= 100
          ? "Yes"
          : "No";

      const socialDone =
        Boolean(u?.social?.google?.verified) &&
        Boolean(u?.social?.linkedin?.verified) &&
        Boolean(u?.social?.instagram?.verified)
          ? "Yes"
          : "No";

      lines.push(
        [
          csvEscape(u?.name),
          csvEscape(u?.email),
          csvEscape(u?.phone),
          csvEscape(u?.collegeOrCompany),
          csvEscape(u?.funnel?.currentStep ?? ""),
          csvEscape(coursesDone),
          csvEscape(u?.certificate?.issued ? "Issued" : "No"),
          csvEscape(socialDone),
          csvEscape(u?.registeredAt ?? ""),
          csvEscape(u?.referralCount ?? 0),
        ].join(",")
      );
    }

    downloadCsv(`users-page-${page}.csv`, lines);
  }

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xl font-extrabold text-white">Users</div>
          <div className="mt-1 text-sm text-cream/80">Search, filter, export, and paginate registrations.</div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search name or email…"
            className="w-full rounded-xl border border-cream/20 bg-transparent px-4 py-2 text-sm text-white outline-none focus:border-primary sm:w-64"
          />
          <select
            value={step}
            onChange={(e) => {
              setStep(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-cream/20 bg-dark/40 px-4 py-2 text-sm text-white outline-none focus:border-primary"
          >
            <option value="">All steps</option>
            {Array.from({ length: 7 }, (_, i) => i + 1).map((s) => (
              <option key={s} value={String(s)}>
                Step {s}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-full border border-primary/40 bg-primary/10 px-5 py-2 text-sm font-bold text-primary"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-[1100px] w-full border-separate border-spacing-y-2 text-sm">
          <thead>
            <tr className="text-left text-cream/80">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">College/Company</th>
              <th className="px-3 py-2">Step</th>
              <th className="px-3 py-2">Courses Done</th>
              <th className="px-3 py-2">Certificate</th>
              <th className="px-3 py-2">Social Done</th>
              <th className="px-3 py-2">Registered At</th>
              <th className="px-3 py-2">Referrals</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-cream/70">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center text-cream/70">
                  No users found.
                </td>
              </tr>
            ) : (
              rows.map((u) => {
                const coursesDone =
                  Number(u?.courses?.aiFundamentals?.progressPercent ?? 0) >= 100 &&
                  Number(u?.courses?.softSkills?.progressPercent ?? 0) >= 100;
                const socialDone =
                  Boolean(u?.social?.google?.verified) &&
                  Boolean(u?.social?.linkedin?.verified) &&
                  Boolean(u?.social?.instagram?.verified);

                return (
                  <motion.tr
                    key={u?._id ?? u?.id ?? u?.email}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-xl bg-secondary/10 hover:bg-secondary/10"
                  >
                    <td className="rounded-l-xl px-3 py-3 text-white">
                      {u?.name}
                    </td>
                    <td className="px-3 py-3 text-white/90">{u?.email}</td>
                    <td className="px-3 py-3 text-white/90">{u?.phone}</td>
                    <td className="px-3 py-3 text-white/90">{u?.collegeOrCompany}</td>
                    <td className="px-3 py-3 text-white/90">{u?.funnel?.currentStep ?? "-"}</td>
                    <td className="px-3 py-3 text-white/90">{coursesDone ? "Yes" : "No"}</td>
                    <td className="px-3 py-3 text-white/90">
                      {u?.certificate?.issued ? "Issued" : "No"}
                    </td>
                    <td className="px-3 py-3 text-white/90">{socialDone ? "Yes" : "No"}</td>
                    <td className="px-3 py-3 text-white/90">
                      {u?.registeredAt ? new Date(u.registeredAt).toLocaleString() : "-"}
                    </td>
                    <td className="rounded-r-xl px-3 py-3 text-white/90">{u?.referralCount ?? 0}</td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-cream/70">
          Page <span className="font-semibold text-white">{page}</span> of{" "}
          <span className="font-semibold text-white">{totalPages}</span> — {total.toLocaleString()} total
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

