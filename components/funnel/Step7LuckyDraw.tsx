"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

import type { IUser } from "@/types";

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 2l3.1 6.4 7.1 1-5.1 5 1.2 7-6.3-3.4-6.3 3.4 1.2-7-5.1-5 7.1-1L12 2z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function Step7LuckyDraw(props: {
  userData: Partial<IUser> & { _id?: string; id?: string };
  setCurrentStep: (step: number) => void;
}) {
  const [reveal, setReveal] = useState(false);

  const prizes = useMemo(
    () => ["Free Goodies", "Course Scholarship Voucher", "Internship Fast-Track"],
    []
  );

  async function onClaim() {
    // Placeholder: POST to confirm entry later.
    props.setCurrentStep(8);
  }

  return (
    <section className="px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mx-auto w-full max-w-4xl text-center"
      >
        <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center">
          <motion.div
            className="relative h-20 w-20 rounded-2xl bg-secondary/20"
            animate={{ rotate: [0, 2, -2, 0], y: [0, -4, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-3 rounded-xl border border-primary/50 bg-primary/10" />
            <motion.div
              className="absolute -top-4 left-1/2 h-8 w-10 -translate-x-1/2 rounded-b-2xl rounded-t-xl border border-primary/60 bg-primary/20"
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </div>

        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">You’re In the Lucky Draw!</h2>
        <p className="mt-2 text-cream/90">
          {props.userData?.name ? `${props.userData.name}, ` : ""}your completion unlocked bonus rewards.
        </p>

        <div className="mt-8">
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setReveal(true)}
            className="rounded-full border border-primary/40 bg-primary/10 px-8 py-3 font-bold text-primary"
          >
            Reveal Prizes
          </motion.button>
        </div>

        <div className="relative mt-6 mx-auto w-full max-w-xl">
          <AnimatePresence>
            {reveal ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur"
              >
                {prizes.map((p, idx) => (
                  <motion.div
                    key={p}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 * idx }}
                    className="flex items-center gap-3 text-white"
                  >
                    <StarIcon className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{p}</span>
                  </motion.div>
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="mt-8">
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => void onClaim()}
            className="rounded-full bg-primary px-10 py-4 font-bold text-dark"
          >
            Claim Your Spot
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
}

