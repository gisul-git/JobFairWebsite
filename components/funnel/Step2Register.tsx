"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import type { IUser } from "@/types";

type FieldErrors = Partial<
  Record<"name" | "email" | "phone" | "collegeOrCompany" | "address" | "referralCode", string>
>;

function Spinner() {
  return (
    <span
      className="inline-block h-5 w-5 animate-spin rounded-full border-[3px] border-transparent border-t-[#1a1a2e]"
      aria-hidden="true"
    />
  );
}

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

export default function Step2Register(props: {
  referralFromUrl?: string;
  userData?: Partial<IUser> & { _id?: string; id?: string };
  setCurrentStep: (step: number) => void;
  setUserData: (user: Partial<IUser> & { _id?: string; id?: string }) => void;
}) {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [collegeOrCompany, setCollegeOrCompany] = useState("");
  const [address, setAddress] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [successFlash, setSuccessFlash] = useState(false);

  useEffect(() => {
    if (props.referralFromUrl) setReferralCode(props.referralFromUrl);
  }, [props.referralFromUrl]);

  useEffect(() => {
    const nextParticles: Particle[] = Array.from({ length: 15 }, (_, i) => ({
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

  const referralApplied = useMemo(() => referralCode.trim().length > 0, [referralCode]);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = "Full Name is required";
    if (!email.trim()) next.email = "Email is required";
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Enter a valid email";
    if (!phone.trim()) next.phone = "Phone is required";
    if (!collegeOrCompany.trim()) next.collegeOrCompany = "College or Company is required";
    if (!address.trim()) next.address = "Address is required";
    return next;
  }

  async function onSubmit() {
    setServerError(null);
    setSuccessFlash(false);
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          collegeOrCompany,
          address,
          referralCode: referralApplied ? referralCode.trim() : undefined,
        }),
      });

      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        setServerError(json?.error ?? "Registration failed");
        return;
      }

      const user = json.data;
      const id = user?._id ?? user?.id ?? null;
      if (id) localStorage.setItem("gisul:userId", String(id));
      const sessionToken = json.sessionToken as string | undefined;
      if (sessionToken) {
        localStorage.setItem("gisul:sessionToken", String(sessionToken));
        localStorage.setItem("gisul_token", String(sessionToken));
      }
      props.setUserData(user);

      setSuccessFlash(true);
      setTimeout(() => props.setCurrentStep(2), 500);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const inputBase =
    "w-full rounded-[12px] border bg-white/6 px-[20px] py-[16px] text-[15px] text-white outline-none backdrop-blur-md transition-all duration-200 ease-in-out placeholder:text-[#f1dcba]/30";
  const inputDefault =
    "border-[#f1dcba]/15 focus:border-[#f4e401]/60 focus:bg-[#f4e401]/6 focus:shadow-[0_0_0_3px_rgba(244,228,1,0.12)]";
  const inputError =
    "border-[#ff4444] shadow-[0_0_0_3px_rgba(255,68,68,0.12)] focus:border-[#ff4444] focus:bg-white/4 focus:shadow-[0_0_0_3px_rgba(255,68,68,0.12)]";
  const labelBase = "mb-[6px] text-[13px] font-medium";
  const errorBase = "text-[12px] font-medium";

  return (
    <section
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-4 sm:px-6 sm:py-6"
      style={{ background: "#0d0d1a" }}
    >
      <div className="absolute inset-0 z-0" />
      <div className="grid-drift absolute inset-0 z-[1]" />

      <div className="pointer-events-none absolute inset-0 z-[2]">
        <div className="radial-main absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
        <div className="radial-secondary absolute -right-[12%] top-[10%] h-[380px] w-[380px] rounded-full" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-[3]">
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

      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass-shell relative z-10 mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-7xl overflow-hidden rounded-[28px] border lg:grid-cols-[1.05fr_0.95fr]"
        style={{
          background:
            "linear-gradient(180deg, rgba(26,26,46,0.78) 0%, rgba(13,13,26,0.84) 100%)",
          borderColor: successFlash ? "#22c55e" : "rgba(105, 82, 162, 0.4)",
          boxShadow: successFlash
            ? "0 0 0 1px rgba(34, 197, 94, 0.2), 0 0 30px rgba(34, 197, 94, 0.4), 0 0 120px rgba(244, 228, 1, 0.04)"
            : "0 0 0 1px rgba(105, 82, 162, 0.2), 0 40px 80px rgba(105, 82, 162, 0.18), 0 0 120px rgba(244, 228, 1, 0.06)",
          transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_28%,transparent_72%,rgba(244,228,1,0.04))]" />
          <div className="absolute left-[8%] top-[10%] h-40 w-40 rounded-full bg-[#f4e401]/10 blur-3xl" />
          <div className="absolute bottom-[8%] right-[6%] h-56 w-56 rounded-full bg-[#6952a2]/18 blur-3xl" />
          <div className="absolute inset-y-0 left-1/2 hidden w-px bg-white/10 lg:block" />
        </div>

        <div className="relative hidden flex-col justify-between p-8 lg:flex xl:p-12">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.45, ease: "easeOut" }}
              className="inline-flex items-center gap-2 rounded-full border border-[#f4e401]/30 bg-[#f4e401]/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#f4e401]"
            >
              Mission Unlock
            </motion.div>

            <motion.h3
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
              className="mt-8 max-w-[12ch] text-5xl font-black leading-[0.95] text-white xl:text-6xl"
            >
              Start The Challenge.
            </motion.h3>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.5, ease: "easeOut" }}
              className="mt-6 max-w-xl text-base leading-7 text-[#f1dcba]/75"
            >
              Create your account to unlock the learning track, earn your certificate, and move
              toward real job opportunities through GISUL.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34, duration: 0.45, ease: "easeOut" }}
            className="grid gap-4"
          >
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-md">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f1dcba]/50">
                  Reward
                </div>
                <div className="mt-2 text-lg font-bold text-white">Free Certificate</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-md">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f1dcba]/50">
                  Access
                </div>
                <div className="mt-2 text-lg font-bold text-white">Partner Network</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-md">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f1dcba]/50">
                  Step
                </div>
                <div className="mt-2 text-lg font-bold text-[#f4e401]">1 / 7</div>
              </div>
            </div>

            <div className="rounded-[24px] border border-[#6952a2]/35 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f1dcba]/50">
                    Progress Buff
                  </div>
                  <div className="mt-2 text-xl font-bold text-white">Fast-track your funnel</div>
                </div>
                <div className="rounded-full border border-[#22c55e]/40 bg-[#22c55e]/15 px-3 py-1 text-xs font-semibold text-[#22c55e]">
                  Active
                </div>
              </div>
              <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "14.285%" }}
                  transition={{ delay: 0.5, duration: 0.7, ease: "easeOut" }}
                  className="h-full rounded-full bg-[linear-gradient(90deg,#f4e401,#ffe96d)] shadow-[0_0_18px_rgba(244,228,1,0.45)]"
                />
              </div>
            </div>
          </motion.div>
        </div>

        <div className="relative flex items-center justify-center p-5 sm:p-8 lg:p-10 xl:p-12">
          <div className="w-full max-w-[560px] rounded-[26px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl sm:p-8 xl:p-10">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
            className="inline-flex items-center justify-center rounded-full px-3 py-1 text-[12px] font-semibold"
            style={{
              background: "rgba(244, 228, 1, 0.10)",
              border: "1px solid rgba(244, 228, 1, 0.30)",
              color: "#f4e401",
              letterSpacing: "0.1em",
            }}
          >
            Step 1 of 7
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
            className="mt-4 text-2xl font-extrabold text-white sm:text-3xl"
          >
            Create Your Free Account
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
            className="mt-2 text-sm sm:text-base"
            style={{ color: "rgba(241, 220, 186, 0.7)" }}
          >
            You’re seconds away from accessing the free courses and earning your certificate.
          </motion.p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-[16px]">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.35, ease: "easeOut" }}
          >
            <label className={labelBase} style={{ color: "rgba(241, 220, 186, 0.8)" }}>
              Full Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${inputBase} ${errors.name ? inputError : inputDefault}`}
              placeholder="Your full name"
            />
            {errors.name ? (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`mt-[6px] ${errorBase}`}
                style={{ color: "#ff6b6b" }}
              >
                {errors.name}
              </motion.p>
            ) : null}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.38, duration: 0.35, ease: "easeOut" }}
          >
            <label className={labelBase} style={{ color: "rgba(241, 220, 186, 0.8)" }}>
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputBase} ${errors.email ? inputError : inputDefault}`}
              placeholder="name@example.com"
              inputMode="email"
            />
            {errors.email ? (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`mt-[6px] ${errorBase}`}
                style={{ color: "#ff6b6b" }}
              >
                {errors.email}
              </motion.p>
            ) : null}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.46, duration: 0.35, ease: "easeOut" }}
          >
            <label className={labelBase} style={{ color: "rgba(241, 220, 186, 0.8)" }}>
              Phone
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`${inputBase} ${errors.phone ? inputError : inputDefault}`}
              placeholder="+91 98765 43210"
              inputMode="tel"
            />
            {errors.phone ? (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`mt-[6px] ${errorBase}`}
                style={{ color: "#ff6b6b" }}
              >
                {errors.phone}
              </motion.p>
            ) : null}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.54, duration: 0.35, ease: "easeOut" }}
          >
            <label className={labelBase} style={{ color: "rgba(241, 220, 186, 0.8)" }}>
              College or Company
            </label>
            <input
              value={collegeOrCompany}
              onChange={(e) => setCollegeOrCompany(e.target.value)}
              className={`${inputBase} ${errors.collegeOrCompany ? inputError : inputDefault}`}
              placeholder="Your college or company"
            />
            {errors.collegeOrCompany ? (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`mt-[6px] ${errorBase}`}
                style={{ color: "#ff6b6b" }}
              >
                {errors.collegeOrCompany}
              </motion.p>
            ) : null}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.62, duration: 0.35, ease: "easeOut" }}
          >
            <label className={labelBase} style={{ color: "rgba(241, 220, 186, 0.8)" }}>
              Address
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={`${inputBase} ${errors.address ? inputError : inputDefault}`}
              placeholder="Your full address"
            />
            {errors.address ? (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`mt-[6px] ${errorBase}`}
                style={{ color: "#ff6b6b" }}
              >
                {errors.address}
              </motion.p>
            ) : null}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.35, ease: "easeOut" }}
          >
            <label className={labelBase} style={{ color: "rgba(241, 220, 186, 0.8)" }}>
              Referral Code
            </label>
            <input
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className={`${inputBase} ${errors.referralCode ? inputError : inputDefault}`}
              placeholder="e.g. A1B2C3D4"
            />

            {referralApplied ? (
              <motion.div
                initial={{ scale: 0.9, y: 6, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 15 }}
                className="mt-[10px] inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-center text-[12px] font-semibold"
                style={{
                  background: "rgba(34, 197, 94, 0.15)",
                  border: "1px solid rgba(34, 197, 94, 0.40)",
                  color: "#22c55e",
                }}
              >
                Referral Applied!
              </motion.div>
            ) : null}
          </motion.div>
        </div>

        {serverError ? (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`mt-4 ${errorBase} text-center`}
            style={{ color: "#ff6b6b" }}
          >
            {serverError}
          </motion.p>
        ) : null}

        <motion.div className="mt-8">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02, boxShadow: "0 0 60px rgba(244,228,1,0.55)" }}
            whileTap={{ scale: 0.98 }}
            onClick={onSubmit}
            disabled={loading}
            className="relative w-full overflow-hidden rounded-full px-8 py-4 text-[16px] font-bold text-[#1a1a2e]"
            style={{
              background: "#f4e401",
              boxShadow: "0 0 40px rgba(244,228,1,0.35)",
              opacity: loading ? 0.8 : 1,
              pointerEvents: loading ? "none" : "auto",
            }}
          >
            {loading ? (
              <span className="relative z-10 inline-flex h-[20px] w-[20px] items-center justify-center">
                <Spinner />
              </span>
            ) : (
              <span className="relative z-10">Submit & Access Free Courses</span>
            )}
            <span className="button-shimmer absolute inset-y-0 -left-1/2 w-1/3" aria-hidden />
          </motion.button>
        </motion.div>
          </div>
        </div>
      </motion.div>

      <style jsx>{`
        .grid-drift {
          background-image: radial-gradient(rgba(241, 220, 186, 0.15) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: gridDrift 8s linear infinite;
        }
        .radial-main {
          background: radial-gradient(circle, rgba(105, 82, 162, 0.25) 0%, rgba(105, 82, 162, 0) 70%);
        }
        .radial-secondary {
          background: radial-gradient(circle, rgba(244, 228, 1, 0.06) 0%, rgba(244, 228, 1, 0) 70%);
        }
        .glass-shell {
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
        }
        .button-shimmer {
          background: linear-gradient(
            120deg,
            transparent 0%,
            rgba(255, 255, 255, 0.7) 50%,
            transparent 100%
          );
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
      `}</style>
    </section>
  );
}

