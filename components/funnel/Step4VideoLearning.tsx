"use client";


import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import type { IUser } from "@/types";

type CourseKey = "aiFundamentals" | "softSkills";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function ConfettiBurst({ show }: { show: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: `c-${i}`,
        size: 6 + (i % 4) * 2,
        x: (i % 13) * 8 - 48,
        y: -10,
        dx: (i % 2 ? 1 : -1) * (30 + (i % 7) * 8),
        dy: 120 + (i % 5) * 25,
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
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: [0, p.dx],
                  y: [0, p.dy],
                  opacity: [1, 1, 0],
                  scale: [1, 1, 0.8],
                }}
                transition={{ duration: 1.1, ease: "easeOut" }}
              />
            ))}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-cream/20">
      <div className="h-2 rounded-full bg-primary" style={{ width: `${clamp(value, 0, 100)}%` }} />
    </div>
  );
}

export default function Step4VideoLearning(props: {
  userId: string | null;
  userData: Partial<IUser> & { _id?: string; id?: string };
  setUserData: (u: Partial<IUser> & { _id?: string; id?: string }) => void;
  setCurrentStep: (step: number) => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}) {
  const [courseProgress, setCourseProgress] = useState<Record<CourseKey, number>>({
    aiFundamentals: 0,
    softSkills: 0,
  });
  const [courseDuration, setCourseDuration] = useState<Record<CourseKey, number>>({
    aiFundamentals: 0,
    softSkills: 0,
  });
  const [courseWatched, setCourseWatched] = useState<Record<CourseKey, number>>({
    aiFundamentals: 0,
    softSkills: 0,
  });
  const [celebrate, setCelebrate] = useState(false);

  const lastSaveTime = useRef<Record<string, number>>({
    aiFundamentals: 0,
    softSkills: 0,
  });

  useEffect(() => {
    setCourseProgress({
      aiFundamentals: Number(props.userData?.courses?.aiFundamentals?.progressPercent ?? 0),
      softSkills: Number(props.userData?.courses?.softSkills?.progressPercent ?? 0),
    });
    setCourseWatched({
      aiFundamentals: Number(props.userData?.courses?.aiFundamentals?.watchedSeconds ?? 0),
      softSkills: Number(props.userData?.courses?.softSkills?.watchedSeconds ?? 0),
    });
  }, [props.userData]);

  function authHeaders(): Record<string, string> {
    const token =
      window.localStorage.getItem("gisul_token") ?? window.localStorage.getItem("gisul:sessionToken");
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  async function apiPost(path: string, payload: Record<string, unknown>, headers: Record<string, string>) {
    const res = await fetch(path, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    const json = (await res.json()) as any;
    if (res.ok && json?.ok && json.data) props.setUserData(json.data);
  }

  const resolveUserId = () => props.userId ?? props.userData?._id ?? props.userData?.id ?? null;

  const handleLoadedMetadata = (courseKey: CourseKey) => (e: any) => {
    const duration = Number(e.target.duration ?? 0);
    setCourseDuration((prev) => ({ ...prev, [courseKey]: duration }));

    const saved = Number(props.userData?.courses?.[courseKey]?.watchedSeconds ?? 0);
    if (saved > 0) {
      e.target.currentTime = saved;
    }
  };

  const handleTimeUpdate = (courseKey: CourseKey) => (e: any) => {
    const currentTime = Number(e.target.currentTime ?? 0);
    const duration = Number(e.target.duration ?? 0);
    if (!duration) return;

    const percent = Math.round((currentTime / duration) * 100);
    setCourseProgress((prev) => ({ ...prev, [courseKey]: percent }));
    setCourseWatched((prev) => ({ ...prev, [courseKey]: Math.floor(currentTime) }));

    const now = Date.now();
    if (now - (lastSaveTime.current[courseKey] ?? 0) > 10_000) {
      lastSaveTime.current[courseKey] = now;
      const uid = resolveUserId();
      if (!uid) return;
      void apiPost(
        "/api/course/progress",
        {
          userId: uid,
          courseKey,
          progressPercent: percent,
          watchedSeconds: Math.floor(currentTime),
        },
        authHeaders()
      );
    }
  };

  const handleVideoEnded = (courseKey: CourseKey) => () => {
    setCourseProgress((prev) => ({ ...prev, [courseKey]: 100 }));
    const uid = resolveUserId();
    if (!uid) return;
    void apiPost(
      "/api/course/progress",
      {
        userId: uid,
        courseKey,
        progressPercent: 100,
        watchedSeconds: Math.floor(courseDuration[courseKey] || 0),
      },
      authHeaders()
    );
    lastSaveTime.current[courseKey] = Date.now();
  }

  const aiCompleted =
    courseProgress.aiFundamentals >= 100 || Boolean(props.userData?.courses?.aiFundamentals?.completed);
  const softCompleted =
    courseProgress.softSkills >= 100 || Boolean(props.userData?.courses?.softSkills?.completed);
  const allCompleted = aiCompleted && softCompleted;
  const alreadyCompleted =
    (props.userData?.courses?.aiFundamentals?.progressPercent ?? 0) >= 100 &&
    (props.userData?.courses?.softSkills?.progressPercent ?? 0) >= 100;

  useEffect(() => {
    if (!celebrate && allCompleted && !alreadyCompleted) {
      setCelebrate(true);
      props.showToast("Progress saved", "success");
      const t1 = window.setTimeout(() => {
        props.setCurrentStep(5);
      }, 1000);
      return () => window.clearTimeout(t1);
    }
  }, [allCompleted, alreadyCompleted, celebrate, props]);

  return (
    <section className="relative px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-6xl"
      >
        <div
          className="inline-flex items-center rounded-full border border-[#f4e401]/30 bg-[#f4e401]/10 px-4 py-2 text-[12px] font-semibold tracking-[0.1em]"
          style={{ color: "#f4e401" }}
        >
          Step 4 of 7
        </div>

        <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">Complete Your Learning</h2>
        <p className="mt-2 text-cream/90">
          Complete both short courses to unlock your certificate and enter the lucky draw.
        </p>

        {alreadyCompleted ? (
          <div className="mt-8 rounded-2xl border border-[#22c55e]/30 bg-[#22c55e]/10 p-6">
            <div className="text-xl font-extrabold text-white">Courses Already Completed</div>
            <div className="mt-2 text-sm font-medium text-[#f1dcba]/80">
              Your learning progress has been restored. Continue to unlock your certificate.
            </div>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02, boxShadow: "0 0 60px rgba(244,228,1,0.55)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => props.setCurrentStep(5)}
              className="mt-6 rounded-full px-8 py-4 text-[16px] font-bold text-[#1a1a2e]"
              style={{ background: "#f4e401", boxShadow: "0 0 40px rgba(244,228,1,0.35)" }}
            >
              Continue →
            </motion.button>
          </div>
        ) : (
          <div className="relative mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <CourseCard
              title="AI Fundamentals"
              duration="30 mins"
              courseKey="aiFundamentals"
              progress={courseProgress.aiFundamentals}
              completed={aiCompleted}
              src={process.env.NEXT_PUBLIC_VIDEO_AI_FUNDAMENTALS}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleVideoEnded}
            />
            <CourseCard
              title="Soft Skills for the Future"
              duration="20 mins"
              courseKey="softSkills"
              progress={courseProgress.softSkills}
              completed={softCompleted}
              src={process.env.NEXT_PUBLIC_VIDEO_SOFT_SKILLS}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleVideoEnded}
            />
          </div>
        )}

        <ConfettiBurst show={celebrate} />
      </motion.div>
    </section>
  );
}

function CourseCard(props: {
  title: string;
  duration: string;
  courseKey: CourseKey;
  progress: number;
  completed: boolean;
  src?: string;
  onTimeUpdate: (courseKey: CourseKey) => (e: any) => void;
  onLoadedMetadata: (courseKey: CourseKey) => (e: any) => void;
  onEnded: (courseKey: CourseKey) => () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  return (
    <div className="rounded-2xl border border-secondary/40 bg-secondary/10 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-bold text-white">{props.title}</div>
          <div className="mt-1 text-sm text-cream/80">{props.duration}</div>
        </div>
        {props.completed ? (
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-dark">Completed</span>
        ) : null}
      </div>

      <div className="mt-4">
        <video
          ref={videoRef}
          className="border border-white/10 bg-black/20"
          style={{ width: "100%", borderRadius: "12px" }}
          controls
          controlsList="nodownload"
          onContextMenu={(e) => e.preventDefault()}
          src={props.src || undefined}
          onTimeUpdate={props.onTimeUpdate(props.courseKey)}
          onLoadedMetadata={props.onLoadedMetadata(props.courseKey)}
          onEnded={props.onEnded(props.courseKey)}
          preload="metadata"
        />
        {!props.src ? (
          <p className="mt-2 text-xs text-cream/60">
            Set{" "}
            <span className="font-mono">
              {props.courseKey === "aiFundamentals"
                ? "NEXT_PUBLIC_VIDEO_AI_FUNDAMENTALS"
                : "NEXT_PUBLIC_VIDEO_SOFT_SKILLS"}
            </span>{" "}
            to your signed Azure video URL.
          </p>
        ) : null}
      </div>

      <div className="mt-4 space-y-2">
        <ProgressBar value={props.progress} />
        <div className="flex items-center justify-between text-sm">
          <span className="text-cream/80">Progress</span>
          <span className="font-semibold text-primary">{Math.round(props.progress)}%</span>
        </div>
      </div>
    </div>
  );
}

