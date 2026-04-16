"use client";

import { motion } from "framer-motion";

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

export default function FunnelProgress(props: {
  currentStep: number;
  completedSteps?: number[];
  onStepClick?: (step: number) => void;
}) {
  const completedSteps = props.completedSteps ?? [];
  const currentStep = props.currentStep;
  const goToStep = props.onStepClick ?? (() => {});
  const total = 7;
  const labels = ["Register", "Follow", "Resume", "Learn", "Certify", "Assess", "Done"];

  // `currentStep` comes from page-level steps (1..8), where step 2 corresponds to the funnel's "Register".
  // So we shift by 1 to map page step 2 -> progress step 1.
  const normalizedStep = Math.min(total, Math.max(1, currentStep - 1));
  const progressRatio = Math.max(0, Math.min(1, (normalizedStep - 1) / (total - 1)));

  return (
    <div className="sticky top-0 z-20 w-full border-b border-[#f1dcba1a] bg-transparent backdrop-blur-sm">
      <div className="mx-auto w-full max-w-6xl px-4 py-4">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="relative flex items-start justify-between gap-2">
            <div className="absolute left-0 right-0 top-5 -z-10 h-[3px] rounded-full bg-[#f1dcba26]" />
            <motion.div
              layoutId="funnel-progress-fill"
              className="absolute left-0 top-5 -z-10 h-[3px] rounded-full bg-secondary"
              initial={{ width: "0%" }}
              animate={{ width: `${progressRatio * 100}%` }}
              transition={{ type: "spring", stiffness: 160, damping: 24 }}
            />

            {Array.from({ length: total }, (_, idx) => {
              const step = (idx + 1) as number;
              // Progress step 1 corresponds to page step 2 ("Register").
              const pageStep = step + 1;
              const isDone = completedSteps.includes(pageStep);
              const isCurrent = normalizedStep === step;

              return (
                <div key={step} className="flex min-w-[54px] flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={() => goToStep(pageStep as any)}
                    className="group relative flex h-10 w-10 items-center justify-center rounded-full"
                    aria-label={`Go to step ${pageStep}`}
                  >
                    <motion.div
                      layout
                      className={[
                        "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold transition-colors",
                        isCurrent
                          ? "border-[#f4e401] bg-[#f4e401] text-[#1a1a2e] shadow-[0_0_16px_#f4e401]"
                          : isDone
                            ? "border-secondary bg-secondary text-white"
                            : "border-[#f1dcba33] bg-transparent text-[#f1dcba66]",
                      ].join(" ")}
                    >
                      {isDone && !isCurrent ? (
                        <CheckIcon className="h-5 w-5 text-white" />
                      ) : (
                        step
                      )}
                    </motion.div>
                  </button>
                  <div className="hidden text-[11px] font-medium text-[#f1dcba99] md:block">
                    {labels[idx]}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

