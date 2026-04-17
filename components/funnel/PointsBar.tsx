"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

const STEP_LABELS = ["Register", "Follow", "Resume", "Learn", "Certify", "Assess", "Done"];

export default function PointsBar(props: { points: number; maxPoints: number; currentStep: number }) {
  const { points, maxPoints, currentStep } = props;
  const targetPct = useMemo(() => {
    const pct = maxPoints > 0 ? (points / maxPoints) * 100 : 0;
    return Math.max(0, Math.min(100, pct));
  }, [maxPoints, points]);
  const currentLabel = STEP_LABELS[Math.max(0, Math.min(STEP_LABELS.length - 1, currentStep - 2))] ?? "Register";

  const [displayedPoints, setDisplayedPoints] = useState(0);
  const lastTargetRef = useRef<number>(0);

  useEffect(() => {
    if (points <= 0) {
      setDisplayedPoints(0);
      lastTargetRef.current = 0;
      return;
    }

    // Keep UI in sync even when the target value hasn't changed
    // (e.g. after refresh when points are restored from persisted state).
    if (lastTargetRef.current === points) {
      setDisplayedPoints(points);
      return;
    }
    lastTargetRef.current = points;

    const start = 0;
    const end = points;
    const ticks = 10; // 1s total / 100ms per tick
    const step = end / ticks;

    setDisplayedPoints(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      const next = Math.round(start + step * i);
      setDisplayedPoints(next);
      if (i >= ticks) {
        window.clearInterval(id);
        setDisplayedPoints(end);
      }
    }, 100);

    return () => window.clearInterval(id);
  }, [points]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -56 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="absolute left-0 right-0 top-0 z-50 h-[64px] sm:h-[72px]"
      style={{
        backgroundColor: "transparent",
        borderBottom: "none",
      }}
    >
      <div className="mx-auto flex h-full items-center px-4" style={{ maxWidth: 1440 }}>
        <div className="flex items-center">
          <img src="/gisul-logo.png" alt="GISUL" className="h-10 w-auto object-contain sm:h-30" />
          <span
            className="mx-2 hidden sm:inline-block"
            style={{ width: 1, height: 20, backgroundColor: "rgba(241, 220, 186, 0.2)" }}
          />
        </div>

        <div className="mx-auto flex h-full flex-1 flex-col justify-center">
          <div
            className="text-center"
            style={{
              color: "rgba(241, 220, 186, 0.4)",
              fontSize: 10,
              letterSpacing: "0.15em",
              fontWeight: 600,
            }}
          >
            YOUR PROGRESS
          </div>
          <div
            className="mt-[2px] text-center"
            style={{
              color: "rgba(241, 220, 186, 0.55)",
              fontSize: 11,
              letterSpacing: "0.08em",
              fontWeight: 700,
            }}
          >
            {currentLabel}
          </div>

          <div className="mt-1 h-[6px] w-full rounded-full" style={{ backgroundColor: "rgba(241, 220, 186, 0.1)" }}>
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: `${targetPct}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
              className="h-full rounded-full"
              style={{
                backgroundImage: "linear-gradient(90deg, #f4e401, #6952a2)",
                boxShadow: "0 0 8px rgba(244, 228, 1, 0.5)",
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-end">
          <span className="text-[17px] font-extrabold sm:text-[20px]" style={{ color: "#f4e401" }}>
            {displayedPoints}
          </span>
          <span className="mx-1 sm:mx-2" style={{ color: "rgba(241, 220, 186, 0.3)", fontWeight: 600 }}>
            /
          </span>
          <span className="text-[11px] font-semibold sm:text-[13px]" style={{ color: "rgba(241, 220, 186, 0.5)" }}>
            {maxPoints} pts
          </span>
        </div>
      </div>
    </motion.div>
  );
}

