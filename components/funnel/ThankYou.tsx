"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";

import type { IUser } from "@/types";

function Confetti({ show }: { show: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 32 }, (_, i) => ({
        id: `t-${i}`,
        size: 6 + (i % 5) * 2,
        dx: (i % 2 ? 1 : -1) * (40 + (i % 7) * 10),
        dy: 160 + (i % 6) * 18,
        color: i % 3 === 0 ? "bg-primary" : i % 3 === 1 ? "bg-secondary" : "bg-cream",
      })),
    []
  );

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="relative h-1 w-1">
            {pieces.map((p) => (
              <motion.div
                key={p.id}
                className={`absolute left-0 top-0 rounded-full ${p.color}`}
                style={{ width: p.size, height: p.size }}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{ x: [0, p.dx], y: [0, p.dy], opacity: [1, 1, 0] }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            ))}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default function ThankYou(props: { userData: Partial<IUser> }) {
  const name = props.userData?.name ?? "Friend";

  return (
    <section className="relative px-6 py-16">
      <Confetti show />
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mx-auto w-full max-w-3xl text-center"
      >
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
          Thank You, <span className="text-primary">{name}</span>!
        </h2>

        <p className="mt-3 text-cream/90">
          Your registration is complete. Our team will contact shortlisted candidates soon.
        </p>
      </motion.div>
    </section>
  );
}

