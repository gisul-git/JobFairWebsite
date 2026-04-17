"use client";

import { motion } from "framer-motion";
import { nanoid } from "nanoid";
import { useMemo, useState } from "react";

import type { IUser } from "@/types";

function formatDate(d?: Date | string) {
  const date = d ? new Date(d) : new Date();
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "2-digit" });
}

export default function Step4Certificate(props: {
  userId: string | null;
  userData: Partial<IUser> & { _id?: string; id?: string };
  setUserData: (u: Partial<IUser> & { _id?: string; id?: string }) => void;
  setCurrentStep: (step: number) => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}) {
  const [loading, setLoading] = useState(false);

  const blobUrl = props.userData?.certificate?.blobUrl;
  const issuedAt = props.userData?.certificate?.issuedAt as any;
  const name = props.userData?.name ?? "Your Name";

  const certificateId = useMemo(() => nanoid(12), []);

  async function ensureCertificate() {
    if (!props.userId) return null;
    if (blobUrl) return blobUrl;

    setLoading(true);
    try {
      const res = await fetch("/api/certificate/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: props.userId }),
      });
      const json = (await res.json()) as any;
      if (res.ok && json?.ok) {
        const url = json.data?.blobUrl as string | undefined;
        if (url) {
          props.setUserData({
            ...props.userData,
            certificate: {
              ...(props.userData.certificate as any),
              blobUrl: url,
              issued: true,
              issuedAt: new Date().toISOString() as any,
            },
          });
        }
        return url ?? null;
      }
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function onDownload() {
    const url = await ensureCertificate();
    if (url) window.open(url, "_blank", "noopener,noreferrer");

    props.showToast("Progress saved", "success");
    props.setCurrentStep(6);
  }

  async function onShareLinkedIn() {
    const url = await ensureCertificate();
    const shareUrl = new URL("https://www.linkedin.com/sharing/share-offsite/");
    shareUrl.searchParams.set("url", url ?? window.location.href);
    window.open(shareUrl.toString(), "_blank", "noopener,noreferrer");

    props.showToast("Progress saved", "success");
    props.setCurrentStep(6);
  }

  return (
    <section className="px-4 py-10 sm:px-6 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-4xl"
      >
        <div className="rounded-2xl border border-primary/70 bg-gradient-to-br from-secondary/60 to-dark p-5 sm:p-8">
          <div className="inline-flex items-center rounded-full border border-[#f4e401]/30 bg-[#f4e401]/10 px-4 py-2 text-[12px] font-semibold tracking-[0.1em] text-[#f4e401]">
            Step 5 of 7
          </div>
          <div className="text-sm font-semibold tracking-widest text-cream/90">GISUL</div>
          <h2 className="mt-3 text-3xl font-extrabold text-white">Certificate of Completion</h2>
          <p className="mt-2 text-cream/90">
            Awarded to <span className="font-semibold text-primary">{name}</span>
          </p>

          <div className="mt-6 rounded-xl border border-white/10 bg-dark/40 p-5">
            <div className="text-sm font-semibold text-cream/90">Completed Courses</div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-white/90">
              <li>AI Fundamentals</li>
              <li>Soft Skills for the Future</li>
            </ul>
            {blobUrl ? (
              <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-white">
                <iframe src={blobUrl} title="Certificate preview" className="h-[260px] w-full sm:h-[360px] lg:h-[420px]" />
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-cream/80">
              <div>
                Issue date: <span className="font-semibold text-white/90">{formatDate(issuedAt)}</span>
              </div>
              <div>
                Certificate ID:{" "}
                <span className="rounded-full border border-secondary/50 bg-secondary/20 px-3 py-1 font-mono text-xs text-white">
                  {certificateId}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <motion.button
              type="button"
              whileHover={{ scale: loading ? 1 : 1.03 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              onClick={onDownload}
              disabled={loading}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-primary px-10 py-4 font-bold text-dark disabled:opacity-70"
            >
              Download PDF
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.99 }}
              onClick={onShareLinkedIn}
              className="inline-flex flex-1 items-center justify-center rounded-full border border-[#0A66C2] bg-transparent px-10 py-4 font-bold text-white"
            >
              Share on LinkedIn
            </motion.button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

