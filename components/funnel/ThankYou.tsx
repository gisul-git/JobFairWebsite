"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

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

export default function ThankYou(props: { userData: Partial<IUser> & { referralCode?: string } }) {
  const [copied, setCopied] = useState(false);

  const name = props.userData?.name ?? "Friend";
  const referralCode = (props.userData as any)?.referralCode ?? "";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const referralLink = referralCode ? `${origin}/?ref=${referralCode}` : `${origin}/`;

  async function copyLink() {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  function shareWhatsApp() {
    const msg = `I just completed GISUL’s free certification. Join with my link: ${referralLink}`;
    const url = new URL("https://wa.me/");
    url.searchParams.set("text", msg);
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  }

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
          Refer a friend → <span className="font-semibold text-primary">Both of you get a bonus reward!</span>
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur">
          <div className="text-sm font-semibold text-cream/90">Your referral link</div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1 rounded-xl border border-cream/20 bg-dark/40 px-4 py-3 font-mono text-xs text-white/90">
              {referralLink}
            </div>
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => void copyLink()}
              className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-dark"
            >
              {copied ? "Copied!" : "Copy Link"}
            </motion.button>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={shareWhatsApp}
              className="w-full rounded-full border border-cream/20 bg-transparent px-6 py-3 text-sm font-bold text-white hover:border-cream/40"
            >
              Share Your Journey
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

