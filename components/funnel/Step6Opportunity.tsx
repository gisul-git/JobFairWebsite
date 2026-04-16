"use client";

import { motion } from "framer-motion";

import type { IUser } from "@/types";

export default function Step6Opportunity(props: {
  userData: Partial<IUser> & { _id?: string; id?: string };
  setUserData: (u: Partial<IUser> & { _id?: string; id?: string }) => void;
  setCurrentStep: (step: number) => void;
}) {

  async function setInterest(interested: boolean) {
    // Placeholder: POST to an API route later.
    const now = new Date().toISOString();
    props.setUserData({
      ...props.userData,
      opportunity: {
        ...(props.userData.opportunity as any),
        interestedInRole: interested,
        respondedAt: now as any,
      },
    });

    props.setCurrentStep(7);
  }

  return (
    <section className="px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur"
      >
        <h2 className="text-2xl font-bold text-white">You’re One Step Away</h2>
        <p className="mt-3 text-cream/90">
          Want a Paid Internship or Full-Time Role at GISUL’s Partner Network?
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => void setInterest(true)}
            className="rounded-full bg-primary px-10 py-4 font-bold text-dark"
          >
            Yes, Apply Now
          </motion.button>

          <button
            type="button"
            onClick={() => void setInterest(false)}
            className="rounded-full bg-transparent px-10 py-4 font-semibold text-cream/50 hover:text-cream/80"
          >
            Maybe Later
          </button>
        </div>
      </motion.div>
    </section>
  );
}

