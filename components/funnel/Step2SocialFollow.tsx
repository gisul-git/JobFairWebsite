"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import type { IUser } from "@/types";

type Particle = {
  id: string;
  size: number;
  x: number;
  y: number;
  color: string;
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
  opacity: number;
};

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M7 11V8a5 5 0 0110 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M6 11h12v10H6V11z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
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

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width={40} height={40} aria-hidden="true">
      <path
        fill="#0077b5"
        d="M20.447 20.452h-3.554v-5.569c0-1.329-.027-3.041-1.852-3.041-1.852 0-2.136 1.445-2.136 2.939v5.671H7.351V9h3.414v1.561h.046c.477-.9 1.638-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.084 0-1.959-.875-1.959-1.959 0-1.084.875-1.959 1.959-1.959s1.959.875 1.959 1.959c0 1.084-.875 1.959-1.959 1.959zM6.889 20.452H3.784V9h3.105v11.452z"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width={40} height={40} aria-hidden="true">
      <defs>
        <linearGradient id="instaGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#833ab4" />
          <stop offset="50%" stopColor="#fd1d1d" />
          <stop offset="100%" stopColor="#fcb045" />
        </linearGradient>
      </defs>
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="5"
        ry="5"
        fill="url(#instaGrad)"
        opacity="0.95"
      />
      <path
        d="M12 8.6a3.4 3.4 0 100 6.8 3.4 3.4 0 000-6.8z"
        fill="rgba(13,13,26,0.35)"
      />
      <circle cx="17.6" cy="6.6" r="1.1" fill="#f4e401" opacity="0.9" />
    </svg>
  );
}

function CountdownRing(props: { secondsLeft: number; totalSeconds: number }) {
  const progress = props.totalSeconds > 0 ? (props.secondsLeft / props.totalSeconds) * 100 : 0;
  const isDanger = props.secondsLeft <= 5;

  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      <motion.div
        animate={isDanger ? { scale: [1, 1.05, 1] } : { scale: 1 }}
        transition={isDanger ? { repeat: Infinity, duration: 0.5 } : undefined}
        className="font-black"
        style={{
          fontSize: 56,
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          color: isDanger ? "#ff6b6b" : "#f4e401",
          textShadow: isDanger ? "0 0 20px rgba(255,107,107,0.6)" : "0 0 20px rgba(244,228,1,0.5)",
        }}
      >
        {props.secondsLeft}
      </motion.div>
      <div
        style={{
          fontSize: 13,
          color: "rgba(241,220,186,0.5)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        seconds
      </div>
      <div
        className="w-full"
        style={{
          height: 3,
          background: "rgba(241,220,186,0.1)",
          borderRadius: 9999,
        }}
      >
        <div
          style={{
            width: `${Math.max(0, Math.min(100, progress))}%`,
            height: "100%",
            borderRadius: 9999,
            background: isDanger ? "#ff6b6b" : "#f4e401",
            boxShadow: isDanger
              ? "0 0 6px rgba(255,107,107,0.6)"
              : "0 0 6px rgba(244,228,1,0.6)",
            transition: "width 1s linear",
          }}
        />
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-6 w-6 animate-spin rounded-full border-[3px] border-transparent border-t-[#1a1a2e]"
      aria-hidden="true"
    />
  );
}

export default function Step2SocialFollow(props: {
  userId: string | null;
  userData: Partial<IUser> & { _id?: string; id?: string };
  setUserData: (u: Partial<IUser> & { _id?: string; id?: string }) => void;
  setCurrentStep: (step: number) => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [linkedinDone, setLinkedinDone] = useState(false);
  const [instagramDone, setInstagramDone] = useState(false);

  const [linkedinEndAt, setLinkedinEndAt] = useState<number | null>(null);
  const [instagramEndAt, setInstagramEndAt] = useState<number | null>(null);
  const [linkedinNow, setLinkedinNow] = useState<number>(Date.now());
  const [instagramNow, setInstagramNow] = useState<number>(Date.now());

  const [loadingContinue, setLoadingContinue] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const nextParticles: Particle[] = Array.from({ length: 140 }, (_, i) => ({
      id: `p-${i}`,
      size: rand(1, 2.8),
      x: rand(0, 100),
      y: rand(0, 100),
      color: "#ffffff",
      driftX: rand(-16, 16),
      driftY: rand(-24, 24),
      duration: rand(2.2, 5.2),
      delay: rand(0, 2.5),
      opacity: rand(0.2, 0.9),
    }));
    setParticles(nextParticles);
  }, []);

  useEffect(() => {
    if (props.userData?.social?.linkedin?.verified) {
      setLinkedinDone(true);
      setLinkedinEndAt(null);
    }
    if (props.userData?.social?.instagram?.verified) {
      setInstagramDone(true);
      setInstagramEndAt(null);
    }
  }, [props.userData]);

  useEffect(() => {
    if (!linkedinEndAt) return;
    const id = window.setInterval(() => setLinkedinNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [linkedinEndAt]);

  useEffect(() => {
    if (!instagramEndAt) return;
    const id = window.setInterval(() => setInstagramNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [instagramEndAt]);

  const TOTAL_SECONDS = 30;
  const linkedinSecondsLeft = linkedinEndAt ? Math.max(0, Math.ceil((linkedinEndAt - linkedinNow) / 1000)) : 0;
  const instagramSecondsLeft = instagramEndAt ? Math.max(0, Math.ceil((instagramEndAt - instagramNow) / 1000)) : 0;

  useEffect(() => {
    if (!linkedinEndAt || linkedinDone) return;
    if (Date.now() >= linkedinEndAt) {
      setLinkedinDone(true);
      setLinkedinEndAt(null);
    }
  }, [linkedinNow, linkedinEndAt, linkedinDone]);

  useEffect(() => {
    if (!instagramEndAt || instagramDone) return;
    if (Date.now() >= instagramEndAt) {
      setInstagramDone(true);
      setInstagramEndAt(null);
    }
  }, [instagramNow, instagramEndAt, instagramDone]);

  async function onContinue() {
    if (!props.userId) return;
    setError(null);
    setLoadingContinue(true);
    try {
      const token = window.localStorage.getItem("gisul_token") ?? window.localStorage.getItem("gisul:sessionToken");
      if (!token) throw new Error("Missing session token. Please register again.");

      const res = await fetch("/api/social/follow", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: props.userId }),
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error ?? "Follow failed");
      }

      const updatedUser = json.data;
      props.setUserData(updatedUser);
      props.showToast("Progress saved", "success");
      props.setCurrentStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Follow failed");
    } finally {
      setLoadingContinue(false);
    }
  }

  function startLinkedIn() {
    if (linkedinDone || linkedinEndAt) return;
    window.open('https://www.linkedin.com/company/14573373/admin/dashboard/', '_blank');
    setLinkedinEndAt(Date.now() + TOTAL_SECONDS * 1000);
  }

  function startInstagram() {
    if (!linkedinDone || instagramDone || instagramEndAt) return;
    window.open(
      "https://www.instagram.com/gisulcommunity?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
      "_blank"
    );
    setInstagramEndAt(Date.now() + TOTAL_SECONDS * 1000);
  }

  const linkedinChecked = linkedinDone && !linkedinEndAt;
  const instagramChecked = instagramDone && !instagramEndAt;

  return (
    <section
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6"
      style={{ background: "#0d0d1a" }}
    >
      <div className="absolute inset-0 z-0" />
      <div className="grid-drift absolute inset-0 z-[1]" />

      <div className="pointer-events-none absolute inset-0 z-[3]">
        <div className="radial-main absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
        <div className="radial-secondary absolute left-[58%] top-[38%] h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
        <div className="aurora aurora-a absolute -left-[10%] top-[12%] h-[460px] w-[520px] rounded-full" />
        <div className="aurora aurora-b absolute -right-[12%] bottom-[2%] h-[520px] w-[620px] rounded-full" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-[4]">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              backgroundColor: p.color,
              opacity: p.opacity,
              boxShadow: `0 0 ${Math.max(2, p.size * 5)}px rgba(255,255,255,0.9)`,
            }}
            animate={{
              y: [0, p.driftY, 0],
              x: [0, p.driftX, 0],
              opacity: [p.opacity * 0.55, p.opacity, p.opacity * 0.55],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: p.delay,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto w-full max-w-2xl py-12">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
            className="inline-flex items-center justify-center rounded-full px-4 py-2 text-[12px] font-semibold tracking-[0.1em]"
            style={{
              background: "rgba(244,228,1,0.10)",
              border: "1px solid rgba(244,228,1,0.3)",
              color: "#f4e401",
              letterSpacing: "0.1em",
            }}
          >
            Step 2 of 7
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
            className="mt-6 text-3xl font-extrabold text-white sm:text-4xl"
          >
            Follow Us to Continue
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
            className="mt-3 text-base sm:text-lg font-medium"
            style={{ color: "rgba(241,220,186,0.7)" }}
          >
            Stay connected with GISUL for opportunities, updates and career resources
          </motion.p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {[0, 1].map((idx) => {
            const delay = idx * 0.15;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut", delay }}
              >
                {idx === 0 ? (
                  <div className="relative rounded-[20px] border border-[#6952a2]/40 bg-[#1a1a2e] p-8">
                    <div className="flex items-start gap-4">
                      <LinkedInIcon />
                      <div className="flex-1">
                        <div className="text-xl font-extrabold text-white">Follow GISUL on LinkedIn</div>
                        <div className="mt-1 text-sm font-medium" style={{ color: "rgba(241,220,186,0.7)" }}>
                          Join our professional network
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      {linkedinChecked ? (
                        <div className="flex flex-col items-center gap-2">
                          <motion.div
                            initial={{ scale: 0.85 }}
                            animate={{ scale: [0.85, 1.15, 1] }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            style={{ color: "#22c55e" }}
                          >
                            <CheckIcon className="h-12 w-12" />
                          </motion.div>
                          <div style={{ color: "#22c55e", fontWeight: 800 }}>Done! LinkedIn followed</div>
                        </div>
                      ) : linkedinEndAt ? (
                        <CountdownRing secondsLeft={linkedinSecondsLeft} totalSeconds={TOTAL_SECONDS} />
                      ) : (
                        <button
                          type="button"
                          onClick={startLinkedIn}
                          disabled={loadingContinue}
                          className="rounded-full border px-6 py-3 font-bold transition-colors hover:bg-[#0077b5]/10"
                          style={{ borderColor: "#0077b5", color: "#0077b5", background: "transparent" }}
                        >
                          Open LinkedIn →
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-[20px] border border-[#6952a2]/40 bg-[#1a1a2e] p-8">
                    <div className="flex items-start gap-4">
                      <InstagramIcon />
                      <div className="flex-1">
                        <div className="text-xl font-extrabold text-white">Follow GISUL on Instagram</div>
                        <div className="mt-1 text-sm font-medium" style={{ color: "rgba(241,220,186,0.7)" }}>
                          See our latest updates and stories
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {!linkedinDone && !props.userData?.social?.instagram?.verified ? (
                        <motion.div
                          key="locked-overlay"
                          initial={{ opacity: 1 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          className="absolute inset-0 z-20 flex flex-col items-center justify-center"
                          style={{ background: "rgba(13,13,26,0.7)" }}
                        >
                          <motion.div
                            initial={{ scale: 1, opacity: 1 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.85, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="flex flex-col items-center"
                            style={{ color: "rgba(241,220,186,0.4)" }}
                          >
                            <LockIcon className="h-10 w-10" />
                            <div className="mt-3 text-center font-semibold" style={{ color: "rgba(241,220,186,0.6)" }}>
                              Complete LinkedIn first
                            </div>
                          </motion.div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>

                    <div className="mt-6">
                      {instagramChecked ? (
                        <div className="flex flex-col items-center gap-2">
                          <motion.div
                            initial={{ scale: 0.85 }}
                            animate={{ scale: [0.85, 1.15, 1] }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            style={{ color: "#22c55e" }}
                          >
                            <CheckIcon className="h-12 w-12" />
                          </motion.div>
                          <div style={{ color: "#22c55e", fontWeight: 800 }}>Done! Instagram followed</div>
                        </div>
                      ) : instagramEndAt ? (
                        <CountdownRing secondsLeft={instagramSecondsLeft} totalSeconds={TOTAL_SECONDS} />
                      ) : (
                        <button
                          type="button"
                          onClick={startInstagram}
                          disabled={!linkedinDone || loadingContinue}
                          className="rounded-full border px-6 py-3 font-bold transition-colors hover:bg-[#833ab4]/10 disabled:opacity-60"
                          style={{
                            borderColor: "#833ab4",
                            color: "#833ab4",
                            background: "transparent",
                          }}
                        >
                          Open Instagram →
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8">
          <AnimatePresence>
            {linkedinDone && instagramDone ? (
              <motion.button
                key="continue"
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 200 }}
                type="button"
                whileHover={{
                  boxShadow: "0 0 60px rgba(244,228,1,0.55)",
                  scale: 1.02,
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => void onContinue()}
                disabled={loadingContinue}
                className="relative w-full overflow-hidden rounded-full px-8 py-4 text-[16px] font-bold text-[#1a1a2e]"
                style={{
                  background: "#f4e401",
                  boxShadow: "0 0 40px rgba(244,228,1,0.35)",
                  opacity: loadingContinue ? 0.8 : 1,
                  pointerEvents: loadingContinue ? "none" : "auto",
                }}
              >
                {loadingContinue ? (
                  <span className="relative z-10 inline-flex items-center justify-center">
                    <Spinner />
                  </span>
                ) : (
                  <span className="relative z-10">
                    {props.userData?.social?.linkedin?.verified && props.userData?.social?.instagram?.verified
                      ? "Already completed — Continue →"
                      : "Continue to Resume Upload →"}
                  </span>
                )}
                <span className="button-shimmer absolute inset-y-0 -left-1/2 w-1/3" aria-hidden />
              </motion.button>
            ) : null}
          </AnimatePresence>

          {error ? <p className="mt-3 text-center text-sm font-semibold" style={{ color: "#ff6b6b" }}>{error}</p> : null}
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
        .aurora {
          filter: blur(70px);
          opacity: 0.55;
          animation: auroraFloat 10s ease-in-out infinite alternate;
        }
        .aurora-a {
          background: radial-gradient(circle, rgba(105, 83, 163, 0.5) 0%, rgba(105, 83, 163, 0) 68%);
        }
        .aurora-b {
          background: radial-gradient(circle, rgba(244, 228, 1, 0.24) 0%, rgba(244, 228, 1, 0) 70%);
          animation-delay: -2s;
        }
        .button-shimmer {
          background: linear-gradient(120deg, transparent 0%, rgba(255, 255, 255, 0.7) 50%, transparent 100%);
          animation: shimmer 3s ease-in-out infinite;
        }
        @keyframes gridDrift {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-40px);
          }
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-200%);
            opacity: 0;
          }
          20% {
            opacity: 0.8;
          }
          60% {
            transform: translateX(450%);
            opacity: 0;
          }
          100% {
            transform: translateX(450%);
            opacity: 0;
          }
        }
        @keyframes auroraFloat {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          100% {
            transform: translate3d(26px, -22px, 0) scale(1.08);
          }
        }
      `}</style>
    </section>
  );
}

