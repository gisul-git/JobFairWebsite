"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import type { IUser } from "@/types";

type ConfettiPiece = {
  id: string;
  size: number;
  dx: number;
  dy: number;
  color: string;
  rotate: number;
};

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M8 3h8v3a4 4 0 01-4 4 4 4 0 01-4-4V3z"
        fill="currentColor"
        opacity="0.95"
      />
      <path
        d="M6 5H4a2 2 0 00-2 2 4 4 0 004 4h2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 5h2a2 2 0 012 2 4 4 0 01-4 4h-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 10v4M8 21h8M9.5 17h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M10 14h4v3h-4z" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M3 10h18v11H3V10z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 10v11" stroke="currentColor" strokeWidth="2" />
      <path d="M3 6h18v4H3V6z" stroke="currentColor" strokeWidth="2" />
      <path
        d="M8.5 6C7 6 6 5.2 6 4.1 6 3 6.9 2.2 8 2.2c1.7 0 3.1 1.8 4 3.8C11.2 4.2 9.9 6 8.5 6zM15.5 6c1.5 0 2.5-.8 2.5-1.9 0-1.1-.9-1.9-2-1.9-1.7 0-3.1 1.8-4 3.8.8-1.8 2.1-3.6 3.5-3.6z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DotTimelineItem(props: { title: string; body: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: props.delay, duration: 0.35, ease: "easeOut" }}
      className="relative pl-8"
    >
      <div className="absolute left-0 top-2 h-2 w-2 rounded-full bg-[#f4e401]" />
      <div className="text-lg font-bold text-white">{props.title}</div>
      <div className="mt-1 text-sm font-medium" style={{ color: "rgba(241,220,186,0.7)" }}>
        {props.body}
      </div>
    </motion.div>
  );
}

export default function Step7HRContact(props: {
  currentStep: number;
  userData: Partial<IUser> & { _id?: string; id?: string; referralCode?: string };
  setUserData: (u: Partial<IUser> & { _id?: string; id?: string }) => void;
  setCurrentStep: (step: number) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const name = props.userData?.name ?? "Candidate";
  const role = props.userData?.role === "BDE" ? "BDE" : props.userData?.role === "Fullstack" ? "Fullstack" : null;
  const roleLabel = role === "BDE" ? "Business Development Executive" : role === "Fullstack" ? "Full Stack Intern" : "Role not set";
  const score = props.userData?.assessment?.score ?? 0;
  const address = props.userData?.address ?? "Address not available";
  const referralCode = props.userData?.referralCode ?? "";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const referralLink = referralCode ? `${origin}/?ref=${referralCode}` : `${origin}/`;

  const confetti = useMemo<ConfettiPiece[]>(
    () =>
      Array.from({ length: 60 }, (_, i) => {
        const angle = (Math.PI * 2 * i) / 60 + Math.random() * 0.35;
        const distance = 90 + Math.random() * 160;
        const size = 4 + Math.random() * 6;
        const colors = ["#f4e401", "#6952a2", "#f1dcba"];
        return {
          id: `hr-confetti-${i}`,
          size,
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance,
          color: colors[i % colors.length],
          rotate: -180 + Math.random() * 360,
        };
      }),
    []
  );

  useEffect(() => {
    if (props.currentStep !== 7) return;

    let cancelled = false;
    (async () => {
      try {
        const token = window.localStorage.getItem("gisul:sessionToken");
        if (!token) return;

        const res = await fetch("/api/funnel/complete", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const json = (await res.json()) as any;
        if (!res.ok || !json?.ok) {
          throw new Error(json?.error ?? "Unable to complete funnel");
        }

        if (cancelled) return;
        props.setUserData(json.data);
        props.setCurrentStep(8);
      } catch (e) {
        if (cancelled) return;
        setCompleteError(e instanceof Error ? e.message : "Unable to complete funnel");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [props.currentStep, props.setCurrentStep, props.setUserData]);

  async function copyLink() {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10"
      style={{ background: "#0d0d1a" }}
    >
      <div className="absolute inset-0 z-0" />
      <div className="grid-drift absolute inset-0 z-[1]" />
      <div className="pointer-events-none absolute inset-0 z-[2]">
        <div className="radial-main absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
        <div className="radial-secondary absolute left-[58%] top-[38%] h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
      </div>

      <div className="pointer-events-none absolute left-1/2 top-1/2 z-[5] h-1 w-1 -translate-x-1/2 -translate-y-1/2">
        {confetti.map((piece) => (
          <motion.div
            key={piece.id}
            className="absolute left-0 top-0 rounded-full"
            style={{ width: piece.size, height: piece.size, backgroundColor: piece.color }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
            animate={{
              x: piece.dx,
              y: piece.dy,
              opacity: [1, 1, 0],
              scale: [1, 1, 0.8],
              rotate: piece.rotate,
            }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="text-center"
        >
          <motion.div
            animate={{ y: [0, -10, 0], scale: [0.96, 1.06, 1] }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="mx-auto mb-5 flex items-center justify-center"
            style={{ color: "#f4e401" }}
          >
            <TrophyIcon className="h-16 w-16" />
          </motion.div>

          <h2 className="text-4xl font-extrabold text-white sm:text-5xl">
            You Did It, <span className="text-[#f4e401]">{name}</span>!
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg" style={{ color: "rgba(241,220,186,0.7)" }}>
            Your application is complete. Our HR team will review your profile and reach out soon.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-5">
          <div className="rounded-2xl border p-6" style={{ background: "rgba(105,82,162,0.10)", borderColor: "rgba(105,82,162,0.30)" }}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: "rgba(241,220,186,0.55)" }}>
                  Role Applied
                </div>
                <div className="mt-2 text-base font-bold text-white">{roleLabel}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: "rgba(241,220,186,0.55)" }}>
                  Assessment Score
                </div>
                <div className="mt-2 text-base font-bold text-white">{score}%</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: "rgba(241,220,186,0.55)" }}>
                  Resume
                </div>
                <div className="mt-2 inline-flex items-center gap-2 font-bold text-[#22c55e]">
                  <CheckIcon className="h-5 w-5" />
                  Uploaded
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.15em]" style={{ color: "rgba(241,220,186,0.55)" }}>
                  Courses
                </div>
                <div className="mt-2 inline-flex items-center gap-2 font-bold text-[#22c55e]">
                  <CheckIcon className="h-5 w-5" />
                  Completed
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border p-6" style={{ background: "rgba(244,228,1,0.08)", borderColor: "rgba(244,228,1,0.25)" }}>
            <div className="flex items-start gap-4">
              <div style={{ color: "#f4e401" }}>
                <GiftIcon className="h-7 w-7" />
              </div>
              <div>
                <div className="text-xl font-bold text-[#f4e401]">Top 3 Performers Win Goodies!</div>
                <div className="mt-2 text-sm sm:text-base" style={{ color: "rgba(241,220,186,0.7)" }}>
                  The top 3 candidates based on assessment scores will receive exclusive GISUL goodies delivered to their address.
                </div>
                <div className="mt-4 text-[12px] font-semibold uppercase tracking-[0.12em]" style={{ color: "rgba(241,220,186,0.5)" }}>
                  Delivery address on file:
                </div>
                <div className="mt-2 text-sm font-medium text-white">{address}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="mb-5 text-xl font-bold text-white">What Happens Next</div>
            <div className="relative space-y-6 pl-2">
              <div className="absolute left-[3px] top-2 bottom-2 w-[2px]" style={{ background: "rgba(105,82,162,0.3)" }} />
              <DotTimelineItem
                delay={0.1}
                title="Profile Review"
                body="Our HR team reviews your resume and assessment score"
              />
              <DotTimelineItem
                delay={0.3}
                title="Shortlisting"
                body="Top candidates are shortlisted within 48 hours"
              />
              <DotTimelineItem
                delay={0.5}
                title="Direct Outreach"
                body="Selected candidates receive a call or email from GISUL HR"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-[#6952a2]/30 bg-[#0d0d1a]/50 p-6">
            <div className="text-xl font-bold text-white">Refer a Friend, Earn Rewards</div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1 truncate rounded-xl border border-[#6952a2]/30 bg-[#1a1a2e] px-4 py-4 text-sm font-medium text-[#f4e401]">
                {referralLink}
              </div>
              <button
                type="button"
                onClick={() => void copyLink()}
                className="rounded-full bg-[#f4e401] px-5 py-3 text-sm font-bold text-[#1a1a2e] shadow-[0_0_30px_rgba(244,228,1,0.25)]"
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
            <div className="mt-3 text-sm font-medium" style={{ color: "rgba(241,220,186,0.5)" }}>
              Both you and your friend get bonus rewards when they complete the platform
            </div>
          </div>

          {completeError ? (
            <div className="text-center text-sm font-semibold text-[#ff6b6b]">{completeError}</div>
          ) : null}
        </div>
      </div>

      <style jsx>{`
        .grid-drift {
          background-image: radial-gradient(rgba(241, 220, 186, 0.15) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: gridDrift 8s linear infinite;
        }
        .radial-main {
          background: radial-gradient(circle, rgba(105, 83, 163, 0.52) 0%, rgba(105, 83, 163, 0) 70%);
        }
        .radial-secondary {
          background: radial-gradient(circle, rgba(244, 228, 1, 0.14) 0%, rgba(244, 228, 1, 0) 70%);
        }
        @keyframes gridDrift {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-40px);
          }
        }
      `}</style>
    </section>
  );
}

