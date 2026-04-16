"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  BDE_QUESTIONS,
  BDE_TIME_LIMIT_MINUTES,
  BDE_TOTAL_QUESTIONS,
} from "@/lib/questions/bde-questions";
import { FULLSTACK_QUESTIONS } from "@/lib/questions/fullstack-questions";
import type { IUser } from "@/types";

type Role = "BDE" | "Fullstack";

type Question = {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
};

type Particle = {
  id: string;
  size: number;
  x: number;
  y: number;
  color: string;
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
  opacity: number;
};

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function formatTime(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function ScoreCircle({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - score / 100);

  return (
    <div className="relative mx-auto flex h-[120px] w-[120px] items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 120 120" className="absolute inset-0">
        <circle cx="60" cy="60" r={radius} stroke="rgba(105,82,162,0.2)" strokeWidth="10" fill="none" />
        <motion.circle
          cx="60"
          cy="60"
          r={radius}
          stroke="#f4e401"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="relative text-center">
        <div className="text-[36px] font-extrabold text-[#f4e401]">{score}</div>
        <div className="text-sm font-semibold" style={{ color: "rgba(241,220,186,0.5)" }}>
          / 100
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-5 w-5 animate-spin rounded-full border-[3px] border-transparent border-t-[#1a1a2e]"
      aria-hidden="true"
    />
  );
}

export default function Step6Assessment(props: {
  userData: Partial<IUser> & { _id?: string; id?: string };
  setUserData: (u: Partial<IUser> & { _id?: string; id?: string }) => void;
  setCurrentStep: (step: number) => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}) {
  const role = props.userData?.role === "BDE" || props.userData?.role === "Fullstack" ? props.userData.role : null;

  const questions: Question[] = useMemo(() => {
    if (role === "BDE") return BDE_QUESTIONS;
    if (role === "Fullstack") return FULLSTACK_QUESTIONS;
    return [];
  }, [role]);

  const totalQuestions = role === "BDE" ? BDE_TOTAL_QUESTIONS : questions.length;
  const totalSeconds = role === "BDE" ? BDE_TIME_LIMIT_MINUTES * 60 : role === "Fullstack" ? 30 * 60 : 0;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const [loadingContinue, setLoadingContinue] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [resumeBanner, setResumeBanner] = useState<string | null>(null);
  const startTriggeredRef = useRef(false);

  useEffect(() => {
    const storedAnswers = props.userData?.assessment?.answersInProgress ?? {};
    const submittedAnswers = props.userData?.assessment?.answers ?? [];
    const completed = Boolean(props.userData?.assessment?.completed);
    const lastIndex = Number(props.userData?.assessment?.lastQuestionIndex ?? 0);
    const startedAt = props.userData?.assessment?.startedAt ? new Date(props.userData.assessment.startedAt).getTime() : null;
    const nextAnswers =
      completed && submittedAnswers.length
        ? Object.fromEntries(submittedAnswers.map((answer, idx) => [String(idx + 1), answer]))
        : storedAnswers;

    setAnswers(nextAnswers);
    setSecondsLeft(totalSeconds);
    setCurrentIndex(completed ? 0 : lastIndex);
    setSubmitted(completed);
    setAlreadySubmitted(completed);
    setScore(Number(props.userData?.assessment?.score ?? 0));
    setCorrectCount(Number(props.userData?.assessment?.correctCount ?? 0));
    setTimeTaken(Number(props.userData?.assessment?.timeTaken ?? 0));
    setResumeBanner(!completed && Object.keys(storedAnswers).length > 0 ? `Resuming your assessment from question ${lastIndex + 1}` : null);

    if (!completed && startedAt) {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = totalSeconds - elapsed;
      if (remaining <= 0) {
        setSecondsLeft(0);
      } else {
        setSecondsLeft(remaining);
      }
    }
  }, [props.userData, role, totalQuestions, totalSeconds]);

  useEffect(() => {
    const nextParticles: Particle[] = Array.from({ length: 90 }, (_, i) => ({
      id: `p-${i}`,
      size: rand(1, 2.8),
      x: rand(0, 100),
      y: rand(0, 100),
      color: "#ffffff",
      driftX: rand(-16, 16),
      driftY: rand(-24, 24),
      duration: rand(2.2, 5.2),
      delay: rand(0, 2.5),
      opacity: rand(0.2, 0.9),
    }));
    setParticles(nextParticles);
  }, []);

  useEffect(() => {
    if (!role || submitted || totalSeconds <= 0) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [role, submitted, totalSeconds]);

  useEffect(() => {
    if (!submitted && role && secondsLeft === 0 && totalQuestions > 0) {
      void handleSubmitAssessment();
    }
  }, [secondsLeft, submitted, role, totalQuestions]);

  useEffect(() => {
    if (!role || submitted || startTriggeredRef.current) return;
    if (Object.keys(props.userData?.assessment?.answersInProgress ?? {}).length > 0 || props.userData?.assessment?.startedAt) {
      return;
    }

    startTriggeredRef.current = true;
    const token = window.localStorage.getItem("gisul_token") ?? window.localStorage.getItem("gisul:sessionToken");
    if (!token) return;

    void fetch("/api/assessment/start", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  }, [props.userData, role, submitted]);

  function selectAnswer(optionIndex: number) {
    const questionId = String(questions[currentIndex]?.id ?? currentIndex + 1);
    setAnswers((prev) => {
      const next = { ...prev };
      next[questionId] = optionIndex;
      return next;
    });
  }

  function calculateResult() {
    let correct = 0;
    questions.forEach((q, idx) => {
      const answer = answers[String(q.id)] ?? answers[String(idx + 1)];
      if (answer === q.correctAnswer) correct += 1;
    });
    const pct = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
    return { correct, pct };
  }

  async function saveProgress(nextQuestionIndex: number) {
    const token = window.localStorage.getItem("gisul_token") ?? window.localStorage.getItem("gisul:sessionToken");
    if (!token) return;

    await fetch("/api/assessment/save-progress", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentQuestion: nextQuestionIndex,
        answers,
      }),
    });
  }

  async function handleSubmitAssessment() {
    if (submitted) return;
    const { correct, pct } = calculateResult();
    setCorrectCount(correct);
    setScore(pct);
    setTimeTaken(totalSeconds - secondsLeft);
    setSubmitted(true);
  }

  async function continueAfterReveal() {
    if (!role) return;
    if (alreadySubmitted) {
      props.setCurrentStep(7);
      return;
    }
    setServerError(null);
    setLoadingContinue(true);
    try {
      const token = window.localStorage.getItem("gisul_token") ?? window.localStorage.getItem("gisul:sessionToken");
      if (!token) throw new Error("Missing session token. Please register again.");

      const answerArray = questions.map((q, idx) => answers[String(q.id)] ?? answers[String(idx + 1)] ?? -1);

      const res = await fetch("/api/assessment/submit", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          answers: answerArray,
          role,
          timeTaken,
        }),
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error ?? "Assessment submit failed");
      }

      props.setUserData(json.data);
      props.showToast("Assessment submitted!", "success");
      props.setCurrentStep(7);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Assessment submit failed");
    } finally {
      setLoadingContinue(false);
    }
  }

  const activeQuestion = questions[currentIndex];
  const currentAnswer = activeQuestion ? (answers[String(activeQuestion.id)] ?? -1) : -1;
  const progressPct = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;
  const lowTime = secondsLeft <= 120;

  return (
    <section
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10"
      style={{ background: "#0d0d1a" }}
    >
      <div className="absolute inset-0 z-0" />
      <div className="grid-drift absolute inset-0 z-[1]" />

      <div className="pointer-events-none absolute inset-0 z-[3]">
        <div className="radial-main absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
        <div className="radial-secondary absolute left-[58%] top-[38%] h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full" />
        <div className="aurora aurora-a absolute -left-[10%] top-[12%] h-[460px] w-[520px] rounded-full" />
        <div className="aurora aurora-b absolute -right-[12%] bottom-[2%] h-[520px] w-[620px] rounded-full" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-[4]">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              backgroundColor: p.color,
              opacity: p.opacity,
              boxShadow: `0 0 ${Math.max(2, p.size * 5)}px rgba(255,255,255,0.9)`,
            }}
            animate={{
              y: [0, p.driftY, 0],
              x: [0, p.driftX, 0],
              opacity: [p.opacity * 0.55, p.opacity, p.opacity * 0.55],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: p.delay,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 mx-auto w-full max-w-3xl">
        <div className="text-center">
          <div className="inline-flex items-center rounded-full border border-[#f4e401]/30 bg-[#f4e401]/10 px-4 py-2 text-[12px] font-semibold tracking-[0.1em] text-[#f4e401]">
            Step 6 of 7
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-white">Skill Assessment</h2>
          <p className="mt-3 text-sm sm:text-base" style={{ color: "rgba(241,220,186,0.7)" }}>
            Complete the assessment for your chosen role
          </p>

          {role === "BDE" ? (
            <div className="mt-4 inline-flex rounded-full border border-[#f4e401]/30 bg-[#f4e401]/10 px-4 py-2 text-sm font-semibold text-[#f4e401]">
              Business Development Executive
            </div>
          ) : null}
          {role === "Fullstack" ? (
            <div className="mt-4 inline-flex rounded-full border border-[#6952a2]/50 bg-[#6952a2]/20 px-4 py-2 text-sm font-semibold text-[#c5b3ff]">
              Full Stack Intern
            </div>
          ) : null}
        </div>

        {!role ? (
          <div className="mt-10 rounded-2xl border border-white/10 bg-[#1a1a2e] p-8 text-center text-white">
            No role selected. Please go back and choose a role before starting the assessment.
          </div>
        ) : submitted ? (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mt-10 rounded-2xl border border-[#6952a2]/40 bg-[#1a1a2e] p-8 text-center"
          >
            <ScoreCircle score={score} />

            {alreadySubmitted ? (
              <div className="mt-5 inline-flex rounded-full border border-[#f4e401]/30 bg-[#f4e401]/10 px-4 py-2 text-sm font-semibold text-[#f4e401]">
                Assessment Already Submitted
              </div>
            ) : null}

            <div className="mt-6">
              {score >= 70 ? (
                <>
                  <div className="text-2xl font-extrabold text-[#22c55e]">Excellent Work!</div>
                  <div className="mt-2 text-sm font-medium" style={{ color: "rgba(241,220,186,0.7)" }}>
                    You&apos;ve qualified for the next round
                  </div>
                </>
              ) : score >= 40 ? (
                <>
                  <div className="text-2xl font-extrabold text-[#f4e401]">Good Effort!</div>
                  <div className="mt-2 text-sm font-medium" style={{ color: "rgba(241,220,186,0.7)" }}>
                    Keep learning and growing
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-extrabold text-[#f1dcba]">Keep Practicing!</div>
                  <div className="mt-2 text-sm font-medium" style={{ color: "rgba(241,220,186,0.7)" }}>
                    Every attempt is a learning opportunity
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 text-sm font-medium" style={{ color: "rgba(241,220,186,0.6)" }}>
              {correctCount} / {totalQuestions} correct
            </div>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02, boxShadow: "0 0 60px rgba(244,228,1,0.55)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => void continueAfterReveal()}
              disabled={loadingContinue}
              className="relative mt-8 w-full overflow-hidden rounded-full px-8 py-4 text-[16px] font-bold text-[#1a1a2e]"
              style={{
                background: "#f4e401",
                boxShadow: "0 0 40px rgba(244,228,1,0.35)",
                opacity: loadingContinue ? 0.85 : 1,
                pointerEvents: loadingContinue ? "none" : "auto",
              }}
            >
              {loadingContinue ? (
                <span className="relative z-10 inline-flex items-center justify-center gap-3">
                  <Spinner />
                </span>
              ) : (
                <span className="relative z-10">Continue →</span>
              )}
            </motion.button>

            {serverError ? (
              <div className="mt-4 text-sm font-semibold text-[#ff6b6b]">{serverError}</div>
            ) : null}
          </motion.div>
        ) : (
          <div className="mt-10">
            {resumeBanner ? (
              <div className="mb-4 rounded-xl border border-[#f4e401]/30 bg-[#f4e401]/10 p-3 text-sm font-semibold text-[#f4e401]">
                {resumeBanner}
              </div>
            ) : null}
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="text-sm font-semibold" style={{ color: "rgba(241,220,186,0.7)" }}>
                  Question {currentIndex + 1} of {totalQuestions}
                </div>
                <div className="mt-2 h-[6px] w-full overflow-hidden rounded-full bg-[#f1dcba]/10">
                  <div
                    className="h-full rounded-full bg-[#f4e401]"
                    style={{ width: `${progressPct}%`, boxShadow: "0 0 8px rgba(244,228,1,0.5)" }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#6952a2]/40 bg-[#1a1a2e] p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="text-xl font-semibold text-white">{activeQuestion?.question}</div>
                <div
                  className={lowTime ? "animate-pulse" : ""}
                  style={{ color: lowTime ? "#ff6b6b" : "rgba(241,220,186,0.9)", fontWeight: 700 }}
                >
                  {formatTime(secondsLeft)}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {activeQuestion?.options.map((option, idx) => {
                  const selected = currentAnswer === idx;
                  return (
                    <button
                      key={`${activeQuestion.id}-${idx}`}
                      type="button"
                      onClick={() => selectAnswer(idx)}
                      className="w-full rounded-xl border p-4 text-left transition-colors"
                      style={{
                        background: selected ? "rgba(244,228,1,0.10)" : "rgba(255,255,255,0.04)",
                        borderColor: selected ? "#f4e401" : "rgba(241,220,186,0.15)",
                        color: selected ? "#f4e401" : "white",
                        boxShadow: selected ? "0 0 16px rgba(244,228,1,0.15)" : undefined,
                      }}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {currentAnswer !== -1 ? (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02, boxShadow: "0 0 60px rgba(244,228,1,0.55)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (currentIndex === totalQuestions - 1) {
                      void handleSubmitAssessment();
                      return;
                    }
                    const nextIndex = currentIndex + 1;
                    void saveProgress(nextIndex);
                    setCurrentIndex(nextIndex);
                  }}
                  className="relative mt-8 overflow-hidden rounded-full px-8 py-4 text-[16px] font-bold text-[#1a1a2e]"
                  style={{
                    background: "#f4e401",
                    boxShadow: "0 0 40px rgba(244,228,1,0.35)",
                  }}
                >
                  {currentIndex === totalQuestions - 1 ? "Submit Assessment" : "Next Question →"}
                </motion.button>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .grid-drift {
          background-image: radial-gradient(rgba(241, 220, 186, 0.15) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: gridDrift 8s linear infinite;
        }
        .radial-main {
          background: radial-gradient(circle, rgba(105, 83, 163, 0.52) 0%, rgba(105, 83, 163, 0) 70%);
        }
        .radial-secondary {
          background: radial-gradient(circle, rgba(244, 228, 1, 0.14) 0%, rgba(244, 228, 1, 0) 70%);
        }
        .aurora {
          filter: blur(70px);
          opacity: 0.55;
          animation: auroraFloat 10s ease-in-out infinite alternate;
        }
        .aurora-a {
          background: radial-gradient(circle, rgba(105, 83, 163, 0.5) 0%, rgba(105, 83, 163, 0) 68%);
        }
        .aurora-b {
          background: radial-gradient(circle, rgba(244, 228, 1, 0.24) 0%, rgba(244, 228, 1, 0) 70%);
          animation-delay: -2s;
        }
        @keyframes gridDrift {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-40px);
          }
        }
        @keyframes auroraFloat {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          100% {
            transform: translate3d(26px, -22px, 0) scale(1.08);
          }
        }
      `}</style>
    </section>
  );
}

