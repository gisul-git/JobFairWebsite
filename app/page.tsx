"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import PointsBar from "@/components/funnel/PointsBar";
import Step1Hero from "@/components/funnel/Step1Hero";
import Step2Register from "@/components/funnel/Step2Register";
import Step2SocialFollow from "@/components/funnel/Step2SocialFollow";
import Step3ResumeUpload from "@/components/funnel/Step3ResumeUpload";
import Step4VideoLearning from "@/components/funnel/Step4VideoLearning";
import Step4Certificate from "@/components/funnel/Step4Certificate";
import Step6Assessment from "@/components/funnel/Step6Assessment";
import Step7HRContact from "@/components/funnel/Step7HRContact";
import Toast from "@/components/ui/Toast";
import type { IUser } from "@/types";
import { STEP_POINTS } from "@/lib/points";

type ToastType = "success" | "error" | "info";

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showIntroHero, setShowIntroHero] = useState(true);
  const [userData, setUserData] = useState<Partial<IUser> & { _id?: string; id?: string }>({});
  const [referralFromUrl, setReferralFromUrl] = useState<string | undefined>(undefined);
  const [userId, setUserId] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  const [checkingSession, setCheckingSession] = useState(true);
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
    visible: boolean;
  }>({
    message: "",
    type: "info",
    visible: false,
  });
  const prevStepRef = useRef<number>(currentStep);

  useEffect(() => {
    const url = new URL(window.location.href);
    const ref = url.searchParams.get("ref")?.trim() || undefined;
    setReferralFromUrl(ref);
  }, []);

  useEffect(() => {
    let cancelled = false;

    function finish() {
      if (!cancelled) setCheckingSession(false);
    }

    (async () => {
      const token = localStorage.getItem("gisul_token") ?? localStorage.getItem("gisul:sessionToken");
      if (!token) {
        setCurrentStep(1);
        finish();
        return;
      }

      try {
        const res = await fetch("/api/user/me", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          localStorage.clear();
          setUserId(null);
          setUserData({});
          setPoints(0);
          setCurrentStep(1);
          showToast("Session expired — please register again", "error");
          finish();
          return;
        }

        const json = (await res.json()) as any;
        if (!res.ok || !json?.ok || !json?.user) {
          setCurrentStep(1);
          finish();
          return;
        }
        if (cancelled) return;

        const u = json.user as any;
        setUserData(u ?? {});
        setPoints(Number(u?.points ?? 0));
        const step = Number(u?.funnel?.currentStep ?? 1);
        if (step >= 1 && step <= 8) setCurrentStep(step);
        const id = u?._id ?? u?.id ?? null;
        if (id) {
          setUserId(String(id));
          localStorage.setItem("gisul:userId", String(id));
        }
        localStorage.setItem("gisul_token", token);
        localStorage.setItem("gisul:sessionToken", token);
        showToast(`Welcome back, ${u?.name ?? "there"}!`, "info");
      } catch {
        setCurrentStep(1);
      } finally {
        finish();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (currentStep !== 1) {
      setShowIntroHero(false);
      return;
    }

    setShowIntroHero(true);
  }, [currentStep]);

  useEffect(() => {
    localStorage.setItem("gisul:currentStep", String(currentStep));
  }, [currentStep]);

  useEffect(() => {
    const prev = prevStepRef.current;
    if (prev === currentStep) return;

    // Registration success: Step2Register sets current step to 2 on success.
    if (prev === 1 && currentStep === 2) {
      setPoints(STEP_POINTS.registration);
    }

    // Social follow complete -> resume upload step
    if (prev === 2 && currentStep === 3) {
      setPoints((p) => p + 10);
    }

    // Resume upload complete -> video learning step
    if (prev === 3 && currentStep === 4) {
      setPoints((p) => p + 10);
    }

    // Video learning complete -> certificate step
    if (prev === 4 && currentStep === 5) {
      setPoints((p) => p + STEP_POINTS.courseComplete);
    }

    // Certificate downloaded/shared -> assessment step
    if (prev === 5 && currentStep === 6) {
      setPoints((p) => p + STEP_POINTS.certificateShared);
    }

    // Assessment step complete -> HR contact step
    if (prev === 6 && currentStep === 7) {
      setPoints((p) => p + STEP_POINTS.socialAll);
    }

    prevStepRef.current = currentStep;
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

  function showToast(message: string, type: ToastType) {
    setToast({ message, type, visible: true });
  }

  return (
    <main className="min-h-screen bg-dark">
      <AnimatePresence>
        {checkingSession ? (
          <motion.div
            key="resume-overlay"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "#0d0d1a" }}
          >
            <div className="text-center">
              <motion.div
                animate={{ scale: [0.95, 1.05, 0.95] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                className="text-[18px] font-extrabold tracking-[0.25em]"
                style={{ color: "#f4e401" }}
              >
                GISUL
              </motion.div>
              <div className="mt-4 text-sm font-semibold" style={{ color: "rgba(241,220,186,0.5)" }}>
                Resuming your journey...
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {currentStep > 1 ? <PointsBar points={points} maxPoints={100} currentStep={currentStep} /> : null}

      <div
        className={
          currentStep === 1
            ? "w-full"
            : currentStep === 2 || currentStep === 3
              ? "w-full pt-[56px]"
              : "mx-auto w-full max-w-6xl px-4 py-10 pt-[56px]"
        }
      >
        <AnimatePresence mode="wait">
          {currentStep === 1 ? (
            <motion.div key="step-1" {...transition}>
              {showIntroHero ? (
                <Step1Hero setCurrentStep={setCurrentStep} onStart={() => setShowIntroHero(false)} />
              ) : (
                <div className="w-full">
                  <Step2Register
                    referralFromUrl={referralFromUrl}
                    userData={userData}
                    setCurrentStep={setCurrentStep}
                    setUserData={setUserData}
                  />
                </div>
              )}
            </motion.div>
          ) : null}

          {currentStep === 2 ? (
            <motion.div key="step-2" {...transition}>
              <Step2SocialFollow
                userId={userId}
                userData={userData}
                setUserData={setUserData}
                setCurrentStep={setCurrentStep}
                showToast={showToast}
              />
            </motion.div>
          ) : null}

          {currentStep === 3 ? (
            <motion.div key="step-3" {...transition}>
              <Step3ResumeUpload
                userId={userId}
                userData={userData}
                setUserData={setUserData}
                setCurrentStep={setCurrentStep}
                showToast={showToast}
              />
            </motion.div>
          ) : null}

          {currentStep === 4 ? (
            <motion.div key="step-4" {...transition}>
              <Step4VideoLearning
                userId={userId}
                userData={userData}
                setUserData={setUserData}
                setCurrentStep={setCurrentStep}
                showToast={showToast}
              />
            </motion.div>
          ) : null}

          {currentStep === 5 ? (
            <motion.div key="step-5" {...transition}>
              <Step4Certificate
                userId={userId}
                userData={userData}
                setUserData={setUserData}
                setCurrentStep={setCurrentStep}
                showToast={showToast}
              />
            </motion.div>
          ) : null}

          {currentStep === 6 ? (
            <motion.div key="step-6" {...transition}>
              <Step6Assessment
                userData={userData}
                setUserData={setUserData}
                setCurrentStep={setCurrentStep}
                showToast={showToast}
              />
            </motion.div>
          ) : null}

          {currentStep === 7 ? (
            <motion.div key="step-7" {...transition}>
              <Step7HRContact
                currentStep={currentStep}
                userData={userData}
                setUserData={setUserData}
                setCurrentStep={setCurrentStep}
              />
            </motion.div>
          ) : null}

          {currentStep === 8 ? (
            <motion.div key="step-8" {...transition}>
              <Step7HRContact
                currentStep={currentStep}
                userData={userData as any}
                setUserData={setUserData}
                setCurrentStep={setCurrentStep}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </main>
  );
}
