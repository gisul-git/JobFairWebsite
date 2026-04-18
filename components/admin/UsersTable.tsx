"use client";

import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

export default function UsersTable() {
  const { data: session } = useSession();
  const isAdmin = Boolean((session?.user as any)?.isAdmin);

  const [search, setSearch] = useState("");
  const [step, setStep] = useState<string>("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

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
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/users?${query}`);
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
  }, [isAdmin, query]);

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
      "Assessment Details",
      "GitHub URL",
      "Deployed URL",
      "Registered At",
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

      const assessmentDetails =
        u?.assessment?.role === "Fullstack"
          ? `Project Submitted${u?.assessment?.notes ? ` | Notes: ${u.assessment.notes}` : ""}`
          : `Score: ${u?.assessment?.score ?? "-"}% | Correct: ${u?.assessment?.correctCount ?? "-"}`;
      const githubUrl = u?.assessment?.role === "Fullstack" ? u?.assessment?.githubUrl ?? "N/A" : "N/A";
      const deployedUrl = u?.assessment?.role === "Fullstack" ? u?.assessment?.deployedUrl ?? "N/A" : "N/A";

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
          csvEscape(assessmentDetails),
          csvEscape(githubUrl),
          csvEscape(deployedUrl),
          csvEscape(u?.registeredAt ?? ""),
        ].join(",")
      );
    }

    downloadCsv(`users-page-${page}.csv`, lines);
  }

  function downloadAssessmentCsv(u: any) {
    const safeName = String(u?.name ?? u?.email ?? "candidate")
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();

    const headers = [
      "Name",
      "Email",
      "Role",
      "Score",
      "Correct Count",
      "Total Questions",
      "Time Taken (sec)",
      "Completed",
      "GitHub URL",
      "Deployed URL",
      "Notes",
      "Started At",
      "Submitted At",
      "Answers",
    ];
    const answers = Array.isArray(u?.assessment?.answers) ? u.assessment.answers.join(" | ") : "";
    const row = [
      csvEscape(u?.name),
      csvEscape(u?.email),
      csvEscape(u?.assessment?.role ?? u?.role ?? ""),
      csvEscape(u?.assessment?.score ?? ""),
      csvEscape(u?.assessment?.correctCount ?? ""),
      csvEscape(u?.assessment?.totalQuestions ?? ""),
      csvEscape(u?.assessment?.timeTaken ?? ""),
      csvEscape(Boolean(u?.assessment?.completed) ? "Yes" : "No"),
      csvEscape(u?.assessment?.githubUrl ?? ""),
      csvEscape(u?.assessment?.deployedUrl ?? ""),
      csvEscape(u?.assessment?.notes ?? ""),
      csvEscape(u?.assessment?.startedAt ?? ""),
      csvEscape(u?.assessment?.submittedAt ?? ""),
      csvEscape(answers),
    ];
    const blob = new Blob([[headers.join(","), row.join(",")].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assessment-${safeName || "candidate"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function openAssessmentPrintView(u: any) {
    const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=1000");
    if (!win) return;
    const answers = Array.isArray(u?.assessment?.answers) ? u.assessment.answers.join(", ") : "N/A";
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Assessment - ${String(u?.name ?? "Candidate")}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
    h1 { margin: 0 0 12px; }
    .meta { margin: 6px 0; }
    .label { font-weight: 700; }
    .block { margin-top: 14px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>Candidate Assessment</h1>
  <div class="meta"><span class="label">Name:</span> ${String(u?.name ?? "-")}</div>
  <div class="meta"><span class="label">Email:</span> ${String(u?.email ?? "-")}</div>
  <div class="meta"><span class="label">Role:</span> ${String(u?.assessment?.role ?? u?.role ?? "-")}</div>
  <div class="meta"><span class="label">Score:</span> ${String(u?.assessment?.score ?? "-")}</div>
  <div class="meta"><span class="label">Correct / Total:</span> ${String(u?.assessment?.correctCount ?? "-")} / ${String(u?.assessment?.totalQuestions ?? "-")}</div>
  <div class="meta"><span class="label">Time Taken (sec):</span> ${String(u?.assessment?.timeTaken ?? "-")}</div>
  <div class="meta"><span class="label">Completed:</span> ${Boolean(u?.assessment?.completed) ? "Yes" : "No"}</div>
  <div class="meta"><span class="label">Started At:</span> ${String(u?.assessment?.startedAt ?? "-")}</div>
  <div class="meta"><span class="label">Submitted At:</span> ${String(u?.assessment?.submittedAt ?? "-")}</div>
  <div class="meta"><span class="label">GitHub URL:</span> ${String(u?.assessment?.githubUrl ?? "-")}</div>
  <div class="meta"><span class="label">Deployed URL:</span> ${String(u?.assessment?.deployedUrl ?? "-")}</div>
  <div class="block"><span class="label">Notes:</span><br/>${String(u?.assessment?.notes ?? "N/A")}</div>
  <div class="block"><span class="label">Answers:</span><br/>${answers}</div>
</body>
</html>`;
    win.document.open();
    win.document.write(html);
    win.document.close();
    setTimeout(() => {
      win.focus();
      win.print();
    }, 200);
  }

  async function deleteUser(u: any) {
    const userId = String(u?._id ?? u?.id ?? "").trim();
    if (!userId) return;
    const name = String(u?.name ?? u?.email ?? "this user");
    const ok = window.confirm(`Delete ${name}? This cannot be undone.`);
    if (!ok) return;

    setDeletingUserId(userId);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        window.alert(json?.error ?? "Failed to delete user");
        return;
      }

      setRows((prev) => prev.filter((r) => String(r?._id ?? r?.id ?? "") !== userId));
      setTotal((prev) => Math.max(0, prev - 1));
    } finally {
      setDeletingUserId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-[#11162a]/85 p-5 backdrop-blur sm:p-6">
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
            className="w-full rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary sm:w-64"
          />
          <select
            value={step}
            onChange={(e) => {
              setStep(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none transition focus:border-primary"
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
            className="rounded-full border border-primary/40 bg-primary/10 px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-primary/20"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[1280px] border-separate border-spacing-y-2 text-sm lg:min-w-[1560px]">
          <thead className="sticky top-0 z-10 bg-[#161c33]">
            <tr className="text-left text-xs uppercase tracking-[0.08em] text-cream/80">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="hidden px-3 py-2 md:table-cell">Phone</th>
              <th className="hidden px-3 py-2 lg:table-cell">College/Company</th>
              <th className="px-3 py-2">Step</th>
              <th className="px-3 py-2">Courses Done</th>
              <th className="px-3 py-2">Certificate</th>
              <th className="px-3 py-2">Social Done</th>
              <th className="hidden px-3 py-2 lg:table-cell">Assessment Details</th>
              <th className="px-3 py-2">Resume</th>
              <th className="px-3 py-2">Assessment</th>
              <th className="px-3 py-2">GitHub URL</th>
              <th className="px-3 py-2">Deployed URL</th>
              <th className="px-3 py-2">Actions</th>
              <th className="hidden px-3 py-2 lg:table-cell">Registered At</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={15} className="px-3 py-8 text-center text-cream/70">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={15} className="px-3 py-8 text-center text-cream/70">
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
                const assessmentDetails =
                  u?.assessment?.role === "Fullstack"
                    ? `Project Submitted${u?.assessment?.notes ? ` | Notes: ${u.assessment.notes}` : ""}`
                    : `Score: ${u?.assessment?.score ?? "-"}% | Correct: ${u?.assessment?.correctCount ?? "-"}`;
                const githubUrl = u?.assessment?.role === "Fullstack" ? u?.assessment?.githubUrl : null;
                const deployedUrl = u?.assessment?.role === "Fullstack" ? u?.assessment?.deployedUrl : null;

                return (
                  <motion.tr
                    key={u?._id ?? u?.id ?? u?.email}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-xl bg-white/[0.02] transition hover:bg-white/[0.05]"
                  >
                    <td className="rounded-l-xl px-3 py-3 font-semibold text-white">
                      {u?.name}
                    </td>
                    <td className="px-3 py-3 text-white/90">{u?.email}</td>
                    <td className="hidden px-3 py-3 text-white/90 md:table-cell">{u?.phone}</td>
                    <td className="hidden px-3 py-3 text-white/90 lg:table-cell">{u?.collegeOrCompany}</td>
                    <td className="px-3 py-3 text-white/90">{u?.funnel?.currentStep ?? "-"}</td>
                    <td className="px-3 py-3 text-white/90">{coursesDone ? "Yes" : "No"}</td>
                    <td className="px-3 py-3 text-white/90">
                      {u?.certificate?.issued ? "Issued" : "No"}
                    </td>
                    <td className="px-3 py-3 text-white/90">{socialDone ? "Yes" : "No"}</td>
                    <td className="hidden max-w-[260px] truncate px-3 py-3 text-white/90 lg:table-cell" title={assessmentDetails}>
                      {assessmentDetails}
                    </td>
                    <td className="px-3 py-3 text-white/90">
                      {u?.resume?.uploaded && u?.resume?.blobUrl ? (
                        <a
                          href={`/api/admin/resume-download?url=${encodeURIComponent(String(u.resume.blobUrl))}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold text-primary transition hover:bg-primary/20"
                        >
                          Download
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="px-3 py-3 text-white/90">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => downloadAssessmentCsv(u)}
                          className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold text-primary transition hover:bg-primary/20"
                        >
                          CSV
                        </button>
                        <button
                          type="button"
                          onClick={() => openAssessmentPrintView(u)}
                          className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold text-primary transition hover:bg-primary/20"
                        >
                          PDF
                        </button>
                      </div>
                    </td>
                    <td className="max-w-[220px] px-3 py-3 text-white/90">
                      {githubUrl ? (
                        <a
                          href={githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block truncate text-[#f4e401] hover:underline"
                          title={githubUrl}
                        >
                          {githubUrl.length > 30 ? `${githubUrl.slice(0, 30)}...` : githubUrl}
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="max-w-[220px] px-3 py-3 text-white/90">
                      {deployedUrl ? (
                        <a
                          href={deployedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block truncate text-[#f4e401] hover:underline"
                          title={deployedUrl}
                        >
                          {deployedUrl.length > 30 ? `${deployedUrl.slice(0, 30)}...` : deployedUrl}
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        disabled={deletingUserId === String(u?._id ?? u?.id ?? "")}
                        onClick={() => void deleteUser(u)}
                        className="rounded-full border border-red-400/40 bg-red-400/10 px-3 py-1 text-xs font-bold text-red-300 transition hover:bg-red-400/20 disabled:opacity-50"
                      >
                        {deletingUserId === String(u?._id ?? u?.id ?? "") ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                    <td className="rounded-r-xl hidden px-3 py-3 text-white/90 lg:table-cell">
                      {u?.registeredAt ? new Date(u.registeredAt).toLocaleString() : "-"}
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
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
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

