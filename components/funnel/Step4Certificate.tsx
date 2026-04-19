"use client";

import { motion } from "framer-motion";
import { nanoid } from "nanoid";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  certificatePngToDataUrl,
  postCertificateRecordOnly,
  postCertificateSharePreview,
  renderCertificatePdfBlob,
  renderCertificatePngBlob,
  safeCertificateFileBase,
} from "@/lib/certificate-client-pdf";
import { normalizeShareUrlToCurrentOrigin } from "@/lib/public-site-url";
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
  const [shareLoading, setShareLoading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const blobUrl = props.userData?.certificate?.blobUrl;
  const issuedAt = props.userData?.certificate?.issuedAt as any;
  const name = props.userData?.name ?? "Your Name";
  const persistedCertId = (props.userData?.certificate as { certificateId?: string } | undefined)?.certificateId;

  const fallbackCertificateId = useMemo(() => nanoid(12), []);
  const certificateId = persistedCertId ?? fallbackCertificateId;

  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const localPreviewRevokeRef = useRef<string | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!blobUrl) {
        if (!cancelled) setPreviewUrl(null);
        return;
      }
      const readable = await getReadableCertificateUrl(blobUrl);
      if (!cancelled) setPreviewUrl(readable);
    })();
    return () => {
      cancelled = true;
    };
  }, [blobUrl]);

  useEffect(() => {
    return () => {
      if (localPreviewRevokeRef.current) {
        URL.revokeObjectURL(localPreviewRevokeRef.current);
        localPreviewRevokeRef.current = null;
      }
    };
  }, []);

  function hasLikelySas(u: string) {
    try {
      const parsed = new URL(u);
      return parsed.searchParams.has("sig") || parsed.searchParams.has("sv");
    } catch {
      return false;
    }
  }

  async function getReadableCertificateUrl(stored: string): Promise<string | null> {
    try {
      if (hasLikelySas(stored)) {
        const head = await fetch(stored, { method: "HEAD" });
        if (head.ok) return stored;
      }
      const res = await fetch(`/api/certificate/sas?url=${encodeURIComponent(stored)}`);
      const json = (await res.json()) as any;
      if (res.ok && json?.ok && json.data?.url) return String(json.data.url);
    } catch {
      // fall through
    }
    return null;
  }

  async function onDownload() {
    if (!props.userId) {
      props.showToast("Missing user account.", "error");
      return;
    }

    setLoading(true);
    try {
      const blob = await renderCertificatePdfBlob({
        name,
        certificateId,
      });

      const objectUrl = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = `gisul-certificate-${safeCertificateFileBase(name) || "user"}.pdf`;
        a.rel = "noopener noreferrer";
        a.target = "_self";
        document.body.appendChild(a);
        a.click();
        a.remove();
      } finally {
        URL.revokeObjectURL(objectUrl);
      }

      const recorded = await postCertificateRecordOnly(props.userId, certificateId);

      if (localPreviewRevokeRef.current) {
        URL.revokeObjectURL(localPreviewRevokeRef.current);
      }
      const nextPreview = URL.createObjectURL(blob);
      localPreviewRevokeRef.current = nextPreview;
      setLocalPreviewUrl(nextPreview);

      props.setUserData({
        ...props.userData,
        points: recorded.points ?? props.userData.points,
        funnel: (recorded.funnel
          ? { ...(props.userData.funnel ?? {}), ...recorded.funnel }
          : props.userData.funnel) as IUser["funnel"],
        certificate: {
          ...(props.userData.certificate as any),
          issued: true,
          issuedAt: new Date().toISOString() as any,
          certificateId: recorded.certificateId,
          blobUrl: recorded.blobUrl ?? props.userData.certificate?.blobUrl,
        },
      });

      setDownloaded(true);
      props.showToast("Certificate downloaded successfully", "success");
    } catch (e) {
      console.error(e);
      props.showToast("Could not generate certificate. Try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function onShareLinkedIn() {
    const sessionToken =
      window.localStorage.getItem("gisul_token") ?? window.localStorage.getItem("gisul:sessionToken");
    if (!sessionToken) {
      props.showToast("Please sign in again to share.", "error");
      return;
    }

    setShareLoading(true);
    try {
      const png = await renderCertificatePngBlob({ name, certificateId });
      const dataUrl = await certificatePngToDataUrl(png);
      const { shareUrl, shareSlug } = await postCertificateSharePreview(sessionToken, dataUrl);

      props.setUserData({
        ...props.userData,
        certificate: {
          ...(props.userData.certificate as any),
          shareSlug: shareSlug ?? (props.userData.certificate as any)?.shareSlug,
        },
      });

      const linkedIn = new URL("https://www.linkedin.com/sharing/share-offsite/");
      linkedIn.searchParams.set("url", normalizeShareUrlToCurrentOrigin(shareUrl));
      window.open(linkedIn.toString(), "_blank", "noopener,noreferrer");

      props.showToast("Opening LinkedIn — the post preview should show your certificate image.", "success");
      props.setCurrentStep(6);
    } catch (e) {
      console.error(e);
      props.showToast(
        e instanceof Error ? e.message : "Could not prepare LinkedIn share. Try again.",
        "error"
      );
    } finally {
      setShareLoading(false);
    }
  }

  const iframeSrc = previewUrl ?? localPreviewUrl;

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
            {iframeSrc ? (
              <div className="mt-5 overflow-hidden rounded-xl border border-white/10 bg-white">
                <iframe src={iframeSrc} title="Certificate preview" className="h-[260px] w-full sm:h-[360px] lg:h-[420px]" />
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
              onClick={() => void onDownload()}
              disabled={loading}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-primary px-10 py-4 font-bold text-dark disabled:opacity-70"
            >
              {loading ? "Preparing PDF…" : "Download PDF"}
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: shareLoading || loading ? 1 : 1.02 }}
              whileTap={{ scale: shareLoading || loading ? 1 : 0.99 }}
              onClick={() => void onShareLinkedIn()}
              disabled={shareLoading || loading}
              className="inline-flex flex-1 items-center justify-center rounded-full border border-[#0A66C2] bg-transparent px-10 py-4 font-bold text-white disabled:opacity-70"
            >
              {shareLoading ? "Preparing share…" : "Share on LinkedIn"}
            </motion.button>
          </div>

          {downloaded ? (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => props.setCurrentStep(6)}
              className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-primary px-10 py-4 font-bold text-dark sm:w-auto"
            >
              Go to Next Step →
            </motion.button>
          ) : null}
        </div>
      </motion.div>
    </section>
  );
}
