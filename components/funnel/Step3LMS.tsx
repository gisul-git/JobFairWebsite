"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import type { IUser } from "@/types";

type CourseKey = "aiFundamentals" | "softSkills";

type CourseState = {
  progressPercent: number;
  watchedSeconds: number;
  completed: boolean;
};

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

export default function Step3LMS(props: {
  userId: string | null;
  userData: Partial<IUser> & { _id?: string; id?: string };
  setUserData: (u: Partial<IUser> & { _id?: string; id?: string }) => void;
  setCurrentStep: (step: number) => void;
}) {

  const [ai, setAi] = useState<CourseState>({ progressPercent: 0, watchedSeconds: 0, completed: false });
  const [soft, setSoft] = useState<CourseState>({ progressPercent: 0, watchedSeconds: 0, completed: false });
  const [celebrate, setCelebrate] = useState(false);

  const lastSentRef = useRef<Record<CourseKey, number>>({ aiFundamentals: 0, softSkills: 0 });

  useEffect(() => {
    const aiProgress = props.userData?.courses?.aiFundamentals?.progressPercent ?? 0;
    const aiWatched = props.userData?.courses?.aiFundamentals?.watchedSeconds ?? 0;
    const aiDone = Boolean(props.userData?.courses?.aiFundamentals?.completed);
    setAi({ progressPercent: aiProgress, watchedSeconds: aiWatched, completed: aiDone || aiProgress >= 100 });

    const softProgress = props.userData?.courses?.softSkills?.progressPercent ?? 0;
    const softWatched = props.userData?.courses?.softSkills?.watchedSeconds ?? 0;
    const softDone = Boolean(props.userData?.courses?.softSkills?.completed);
    setSoft({
      progressPercent: softProgress,
      watchedSeconds: softWatched,
      completed: softDone || softProgress >= 100,
    });
  }, [props.userData]);

  async function postProgress(courseKey: CourseKey, progressPercent: number, watchedSeconds: number) {
    if (!props.userId) return;

    const now = Date.now();
    if (now - (lastSentRef.current[courseKey] ?? 0) < 10_000) return;
    lastSentRef.current[courseKey] = now;

    const res = await fetch("/api/course/progress", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: props.userId, courseKey, progressPercent, watchedSeconds }),
    });
    const json = (await res.json()) as any;
    if (res.ok && json?.ok && json.data) props.setUserData(json.data);
  }

  async function onTimeUpdate(courseKey: CourseKey, video: HTMLVideoElement) {
    if (!video.duration || Number.isNaN(video.duration)) return;
    const progressPercent = clamp((video.currentTime / video.duration) * 100, 0, 100);
    const watchedSeconds = Math.floor(video.currentTime);
    await postProgress(courseKey, progressPercent, watchedSeconds);

    if (courseKey === "aiFundamentals") {
      setAi((s) => ({ ...s, progressPercent, watchedSeconds, completed: s.completed || progressPercent >= 100 }));
    } else {
      setSoft((s) => ({ ...s, progressPercent, watchedSeconds, completed: s.completed || progressPercent >= 100 }));
    }
  }

  useEffect(() => {
    if (!celebrate && ai.completed && soft.completed) {
      setCelebrate(true);
      const t1 = window.setTimeout(() => {
        props.setCurrentStep(4);
      }, 1000);
      return () => window.clearTimeout(t1);
    }
  }, [ai.completed, celebrate, props.setCurrentStep, soft.completed]);

  return (
    <section className="relative px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-6xl"
      >
        <h2 className="text-2xl font-bold text-white sm:text-3xl">Free Courses (Watch to 100%)</h2>
        <p className="mt-2 text-cream/90">
          Complete both short courses to unlock your certificate and enter the lucky draw.
        </p>

        <div className="relative mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <CourseCard
            title="AI Fundamentals"
            duration="30 mins"
            courseKey="aiFundamentals"
            progress={ai.progressPercent}
            completed={ai.completed}
            onTimeUpdate={onTimeUpdate}
          />
          <CourseCard
            title="Soft Skills for the Future"
            duration="20 mins"
            courseKey="softSkills"
            progress={soft.progressPercent}
            completed={soft.completed}
            onTimeUpdate={onTimeUpdate}
          />
        </div>

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
  onTimeUpdate: (courseKey: CourseKey, video: HTMLVideoElement) => void;
}) {
  const src =
    props.courseKey === "aiFundamentals"
      ? process.env.NEXT_PUBLIC_AI_FUNDAMENTALS_URL
      : process.env.NEXT_PUBLIC_SOFT_SKILLS_URL;

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
          className="w-full rounded-xl border border-white/10 bg-black/20"
          controls
          src={src || undefined}
          onTimeUpdate={(e) => props.onTimeUpdate(props.courseKey, e.currentTarget)}
        />
        {!src ? (
          <p className="mt-2 text-xs text-cream/60">
            Set{" "}
            <span className="font-mono">
              {props.courseKey === "aiFundamentals"
                ? "NEXT_PUBLIC_AI_FUNDAMENTALS_URL"
                : "NEXT_PUBLIC_SOFT_SKILLS_URL"}
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

