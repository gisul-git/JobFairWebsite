"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import type { IUser } from "@/types";

type FieldErrors = Partial<Record<"name" | "email" | "phone" | "collegeOrCompany" | "referralCode", string>>;

function Spinner() {
  return (
    <span
      className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-dark/30 border-t-dark"
      aria-hidden="true"
    />
  );
}

export default function Step2Register(props: {
  referralFromUrl?: string;
  setCurrentStep: (step: number) => void;
  setUserData: (user: Partial<IUser> & { _id?: string; id?: string }) => void;
}) {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [collegeOrCompany, setCollegeOrCompany] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (props.referralFromUrl) setReferralCode(props.referralFromUrl);
  }, [props.referralFromUrl]);

  const referralApplied = useMemo(() => referralCode.trim().length > 0, [referralCode]);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = "Full Name is required";
    if (!email.trim()) next.email = "Email is required";
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Enter a valid email";
    if (!phone.trim()) next.phone = "Phone is required";
    if (!collegeOrCompany.trim()) next.collegeOrCompany = "College or Company is required";
    return next;
  }

  async function onSubmit() {
    setServerError(null);
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
      props.setUserData(user);

      props.setCurrentStep(3);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-2xl rounded-2xl border border-secondary/60 bg-secondary/20 p-8 backdrop-blur"
      >
        <h2 className="text-2xl font-bold text-white sm:text-3xl">Create Your Free Account</h2>
        <p className="mt-2 text-cream/90">
          You’re seconds away from accessing the free courses and earning your certificate.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4">
          <div>
            <label className="text-sm font-medium text-cream/90">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-cream/30 bg-transparent px-4 py-3 text-white outline-none transition-colors focus:border-primary"
              placeholder="Your full name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-300">{errors.name}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-cream/90">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-cream/30 bg-transparent px-4 py-3 text-white outline-none transition-colors focus:border-primary"
              placeholder="name@example.com"
              inputMode="email"
            />
            {errors.email && <p className="mt-1 text-sm text-red-300">{errors.email}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-cream/90">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2 w-full rounded-xl border border-cream/30 bg-transparent px-4 py-3 text-white outline-none transition-colors focus:border-primary"
              placeholder="+91 98765 43210"
              inputMode="tel"
            />
            {errors.phone && <p className="mt-1 text-sm text-red-300">{errors.phone}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-cream/90">College or Company</label>
            <input
              value={collegeOrCompany}
              onChange={(e) => setCollegeOrCompany(e.target.value)}
              className="mt-2 w-full rounded-xl border border-cream/30 bg-transparent px-4 py-3 text-white outline-none transition-colors focus:border-primary"
              placeholder="Your college or company"
            />
            {errors.collegeOrCompany && (
              <p className="mt-1 text-sm text-red-300">{errors.collegeOrCompany}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-cream/90">Referral Code (optional)</label>
              {referralApplied && (
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-dark">
                  Referral applied!
                </span>
              )}
            </div>
            <input
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="mt-2 w-full rounded-xl border border-cream/30 bg-transparent px-4 py-3 text-white outline-none transition-colors focus:border-primary"
              placeholder="e.g. A1B2C3D4"
            />
          </div>
        </div>

        {serverError && <p className="mt-4 text-sm text-red-300">{serverError}</p>}

        <div className="mt-6">
          <motion.button
            type="button"
            whileHover={{ scale: loading ? 1 : 1.03 }}
            whileTap={{ scale: loading ? 1 : 0.99 }}
            onClick={onSubmit}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-primary px-10 py-4 text-base font-bold text-dark disabled:opacity-70"
          >
            {loading ? (
              <>
                <Spinner /> Submitting...
              </>
            ) : (
              "Submit & Access Free Courses"
            )}
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
}

