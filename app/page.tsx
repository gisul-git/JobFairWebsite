"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import FunnelProgress from "@/components/funnel/FunnelProgress";
import Step1Hero from "@/components/funnel/Step1Hero";
import Step2Register from "@/components/funnel/Step2Register";
import Step3LMS from "@/components/funnel/Step3LMS";
import Step4Certificate from "@/components/funnel/Step4Certificate";
import Step5Social from "@/components/funnel/Step5Social";
import Step6Opportunity from "@/components/funnel/Step6Opportunity";
import Step7LuckyDraw from "@/components/funnel/Step7LuckyDraw";
import ThankYou from "@/components/funnel/ThankYou";
import type { IUser } from "@/types";

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [userData, setUserData] = useState<Partial<IUser> & { _id?: string; id?: string }>({});
  const [referralFromUrl, setReferralFromUrl] = useState<string | undefined>(undefined);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const ref = url.searchParams.get("ref")?.trim() || undefined;
    setReferralFromUrl(ref);

    const storedUserId = localStorage.getItem("gisul:userId");
    if (storedUserId) setUserId(storedUserId);
  }, []);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/user?userId=${encodeURIComponent(userId)}`, { method: "GET" });
        const json = (await res.json()) as any;
        if (!res.ok || !json?.ok) return;
        if (cancelled) return;

        const u = json.data as any;
        setUserData(u ?? {});
        const step = Number(u?.funnel?.currentStep ?? 1);
        if (step >= 1 && step <= 8) setCurrentStep(step);
      } catch {
        // ignore resume failures
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    localStorage.setItem("gisul:currentStep", String(currentStep));
  }, [currentStep]);

  const transition = useMemo(
    () => ({
      initial: { opacity: 0, y: 40 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
      transition: { duration: 0.5, ease: "easeOut" as const },
    }),
    []
  );

  useEffect(() => {
    const id = (userData as any)?._id ?? (userData as any)?.id ?? null;
    if (id) {
      setUserId(String(id));
      localStorage.setItem("gisul:userId", String(id));
    }
  }, [userData]);

  return (
    <main className="min-h-screen bg-dark">
      {currentStep > 1 ? <FunnelProgress currentStep={currentStep} /> : null}

      <div className={currentStep === 1 ? "w-full" : "mx-auto w-full max-w-6xl px-4 py-10"}>
        <AnimatePresence mode="wait">
          {currentStep === 1 ? (
            <motion.div key="step-1" {...transition}>
              <Step1Hero setCurrentStep={setCurrentStep} />
            </motion.div>
          ) : null}

          {currentStep === 2 ? (
            <motion.div key="step-2" {...transition}>
              <Step2Register
                referralFromUrl={referralFromUrl}
                setCurrentStep={setCurrentStep}
                setUserData={setUserData}
              />
            </motion.div>
          ) : null}

          {currentStep === 3 ? (
            <motion.div key="step-3" {...transition}>
              <Step3LMS
                userId={userId}
                userData={userData}
                setUserData={setUserData}
                setCurrentStep={setCurrentStep}
              />
            </motion.div>
          ) : null}

          {currentStep === 4 ? (
            <motion.div key="step-4" {...transition}>
              <Step4Certificate
                userId={userId}
                userData={userData}
                setUserData={setUserData}
                setCurrentStep={setCurrentStep}
              />
            </motion.div>
          ) : null}

          {currentStep === 5 ? (
            <motion.div key="step-5" {...transition}>
              <Step5Social
                userId={userId}
                userData={userData}
                setUserData={setUserData}
                setCurrentStep={setCurrentStep}
              />
            </motion.div>
          ) : null}

          {currentStep === 6 ? (
            <motion.div key="step-6" {...transition}>
              <Step6Opportunity
                userData={userData}
                setUserData={setUserData}
                setCurrentStep={setCurrentStep}
              />
            </motion.div>
          ) : null}

          {currentStep === 7 ? (
            <motion.div key="step-7" {...transition}>
              <Step7LuckyDraw userData={userData} setCurrentStep={setCurrentStep} />
            </motion.div>
          ) : null}

          {currentStep === 8 ? (
            <motion.div key="step-8" {...transition}>
              <ThankYou userData={userData as any} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </main>
  );
}
