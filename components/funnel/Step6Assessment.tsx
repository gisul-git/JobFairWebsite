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
  const isBde = role === "BDE";
  const isFullstack = role === "Fullstack";

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
  const [correctCount, setCorrectCount] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const [loadingContinue, setLoadingContinue] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [resumeBanner, setResumeBanner] = useState<string | null>(null);
  const startTriggeredRef = useRef(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [deployedUrl, setDeployedUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submittingProject, setSubmittingProject] = useState(false);

  useEffect(() => {
    if (isFullstack) {
      setSubmitted(Boolean(props.userData?.assessment?.completed));
      setAlreadySubmitted(Boolean(props.userData?.assessment?.completed));
      setGithubUrl(String((props.userData as any)?.assessment?.githubUrl ?? ""));
      setDeployedUrl(String((props.userData as any)?.assessment?.deployedUrl ?? ""));
      setNotes(String((props.userData as any)?.assessment?.notes ?? ""));
      return;
    }

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
  }, [props.userData, isFullstack, role, totalQuestions, totalSeconds]);

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
    if (!isBde || submitted || totalSeconds <= 0) return;
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
  }, [isBde, submitted, totalSeconds]);

  useEffect(() => {
    if (isBde && !submitted && role && secondsLeft === 0 && totalQuestions > 0) {
      void handleSubmitAssessment();
    }
  }, [isBde, secondsLeft, submitted, role, totalQuestions]);

  useEffect(() => {
    if (!isBde || !role || submitted || startTriggeredRef.current) return;
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
  }, [isBde, props.userData, role, submitted]);

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
    const { correct } = calculateResult();
    setCorrectCount(correct);
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

  async function submitFullstackProject() {
    setSubmissionError(null);
    if (!githubUrl.trim().startsWith("https://github.com/")) {
      setSubmissionError("Please enter a valid GitHub URL");
      return;
    }
    if (!deployedUrl.trim().startsWith("https://")) {
      setSubmissionError("Please enter a valid deployed URL");
      return;
    }

    setSubmittingProject(true);
    try {
      const token = window.localStorage.getItem("gisul_token") ?? window.localStorage.getItem("gisul:sessionToken");
      if (!token) throw new Error("Missing session token. Please register again.");

      const res = await fetch("/api/assessment/submit", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: "Fullstack",
          githubUrl: githubUrl.trim(),
          deployedUrl: deployedUrl.trim(),
          notes: notes.trim(),
        }),
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error ?? "Project submission failed");
      }

      props.setUserData(json.data);
      props.showToast("Project submitted successfully!", "success");
      setSubmitted(true);
      setAlreadySubmitted(true);
    } catch (e) {
      setSubmissionError(e instanceof Error ? e.message : "Project submission failed");
    } finally {
      setSubmittingProject(false);
    }
  }

  const activeQuestion = questions[currentIndex];
  const currentAnswer = activeQuestion ? (answers[String(activeQuestion.id)] ?? -1) : -1;
  const progressPct = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;
  const lowTime = secondsLeft <= 120;

  return (
    <section
      className="relative flex min-h-[100dvh] min-h-screen items-center justify-center overflow-x-hidden overflow-y-auto px-6 pb-10 pt-[calc(5.25rem+env(safe-area-inset-top,0px))] sm:pt-[calc(6rem+env(safe-area-inset-top,0px))]"
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
        ) : isFullstack ? (
          submitted ? (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="mt-10 rounded-2xl border border-[#6952a2]/40 bg-[#1a1a2e] p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 12 }}
                className="mx-auto flex h-[100px] w-[100px] items-center justify-center rounded-full border-2 border-[#22c55e]"
                style={{ background: "rgba(34,197,94,0.15)" }}
              >
                <svg viewBox="0 0 24 24" width="40" height="40" fill="none" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.div>

              <div className="mt-5 text-[28px] font-extrabold text-white">Project Submitted!</div>
              <div className="mx-auto mt-2 max-w-sm text-sm" style={{ color: "rgba(241,220,186,0.7)" }}>
                Your submission has been received. Our technical team will review your GitHub repo and deployed project.
              </div>

              <div
                className="mx-auto mt-6 max-w-xl rounded-xl p-5 text-left"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(241,220,186,0.10)" }}
              >
                <div className="mb-3">
                  <div className="text-xs font-semibold" style={{ color: "rgba(241,220,186,0.5)" }}>
                    GitHub:
                  </div>
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-sm font-semibold"
                    style={{ color: "#6952a2" }}
                  >
                    {githubUrl}
                  </a>
                </div>
                <div>
                  <div className="text-xs font-semibold" style={{ color: "rgba(241,220,186,0.5)" }}>
                    Live URL:
                  </div>
                  <a
                    href={deployedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-sm font-semibold"
                    style={{ color: "#6952a2" }}
                  >
                    {deployedUrl}
                  </a>
                </div>
              </div>

              <motion.button
                type="button"
                whileHover={{ scale: 1.02, boxShadow: "0 0 60px rgba(244,228,1,0.55)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => props.setCurrentStep(7)}
                className="relative mt-8 w-full overflow-hidden rounded-full px-8 py-4 text-[16px] font-bold text-[#1a1a2e]"
                style={{ background: "#f4e401", boxShadow: "0 0 40px rgba(244,228,1,0.35)" }}
              >
                Continue →
              </motion.button>
            </motion.div>
          ) : (
            <div className="mt-10 grid gap-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border p-8"
                style={{ background: "#1a1a2e", borderColor: "rgba(105,82,162,0.4)" }}
              >
                <div className="flex items-start gap-4">
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" aria-hidden="true">
                    <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" stroke="#f4e401" strokeWidth="2" />
                    <path d="M14 2v5h5" stroke="#f4e401" strokeWidth="2" />
                  </svg>
                  <div>
                    <div className="text-[22px] font-extrabold text-white">Full Stack Tech Assessment</div>
                    <div className="text-sm" style={{ color: "rgba(241,220,186,0.6)" }}>
                      Build a real project and submit your work
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  {[
                    "Download the problem statement below",
                    "Read the requirements carefully",
                    "Build and deploy your project",
                    "Submit your GitHub repo and live URL",
                  ].map((text, idx) => (
                    <div key={text}>
                      <div className="flex items-center gap-3">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6952a2] text-xs text-white">
                          {idx + 1}
                        </div>
                        <div className="text-sm" style={{ color: "rgba(241,220,186,0.8)" }}>
                          {text}
                        </div>
                      </div>
                      {idx < 3 ? (
                        <div className="ml-[11px] mt-2 h-5 w-0 border-l-2" style={{ borderColor: "rgba(105,82,162,0.3)" }} />
                      ) : null}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    window.open(
                      "https://gisulwebsiteproduction.blob.core.windows.net/coursevideo/Gisul%20Fullstack%20Assessment.docx",
                      "_blank"
                    );
                    setHasDownloaded(true);
                  }}
                  className="mt-6 w-full rounded-xl border px-4 py-4 text-left"
                  style={{ background: "#6952a2", borderColor: "#6952a2" }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
                        <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" stroke="#fff" strokeWidth="2" />
                        <path d="M14 2v5h5" stroke="#fff" strokeWidth="2" />
                      </svg>
                      <div>
                        <div className="font-semibold text-white">Gisul Fullstack Assessment.docx</div>
                        <div className="text-xs" style={{ color: "rgba(241,220,186,0.5)" }}>
                          Problem Statement • DOCX
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-[#f4e401]">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
                        <path d="M12 3v12" stroke="#f4e401" strokeWidth="2" strokeLinecap="round" />
                        <path d="M7 10l5 5 5-5" stroke="#f4e401" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Download
                    </div>
                  </div>
                </button>

                {hasDownloaded ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      background: "rgba(34,197,94,0.15)",
                      border: "1px solid rgba(34,197,94,0.30)",
                      color: "#22c55e",
                    }}
                  >
                    Downloaded!
                  </motion.div>
                ) : null}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border p-8"
                style={{ background: "#1a1a2e", borderColor: "rgba(105,82,162,0.4)" }}
              >
                <div className="text-xl font-extrabold text-white">Submit Your Project</div>
                <div className="mt-1 text-sm" style={{ color: "rgba(241,220,186,0.6)" }}>
                  Once your project is ready, submit the links below
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-semibold text-white">GitHub Repository URL</label>
                  <input
                    placeholder="https://github.com/yourusername/project-name"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full rounded-[10px] border px-4 py-[14px] text-white outline-none transition-colors placeholder:text-[#f1dcba55] focus:border-[#f4e40199] focus:bg-[#f4e4010a]"
                    style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(241,220,186,0.15)" }}
                  />
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-semibold text-white">Deployed Project URL</label>
                  <input
                    placeholder="https://your-project.vercel.app"
                    value={deployedUrl}
                    onChange={(e) => setDeployedUrl(e.target.value)}
                    className="w-full rounded-[10px] border px-4 py-[14px] text-white outline-none transition-colors placeholder:text-[#f1dcba55] focus:border-[#f4e40199] focus:bg-[#f4e4010a]"
                    style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(241,220,186,0.15)" }}
                  />
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-semibold text-white">Additional Notes (optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Any notes about your implementation, tech stack used, or special instructions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-[10px] border px-4 py-[14px] text-white outline-none transition-colors placeholder:text-[#f1dcba55] focus:border-[#f4e40199] focus:bg-[#f4e4010a]"
                    style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(241,220,186,0.15)" }}
                  />
                </div>

                {submissionError ? (
                  <div className="mt-3 text-sm font-semibold text-[#ff6b6b]">{submissionError}</div>
                ) : null}

                <motion.button
                  type="button"
                  whileHover={{ scale: submittingProject ? 1 : 1.02, boxShadow: submittingProject ? undefined : "0 0 60px rgba(244,228,1,0.55)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => void submitFullstackProject()}
                  disabled={submittingProject || !githubUrl.trim() || !deployedUrl.trim()}
                  className="relative mt-6 w-full overflow-hidden rounded-full px-8 py-4 text-[16px] font-bold text-[#1a1a2e]"
                  style={{
                    background: "#f4e401",
                    boxShadow: "0 0 40px rgba(244,228,1,0.35)",
                    opacity: submittingProject || !githubUrl.trim() || !deployedUrl.trim() ? 0.5 : 1,
                    cursor: submittingProject || !githubUrl.trim() || !deployedUrl.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  {submittingProject ? (
                    <span className="relative z-10 inline-flex items-center justify-center gap-3">
                      <Spinner />
                      Submitting...
                    </span>
                  ) : (
                    <span className="relative z-10">Submit Project →</span>
                  )}
                </motion.button>

                <div className="mt-3 text-center text-xs" style={{ color: "rgba(241,220,186,0.4)" }}>
                  Make sure your GitHub repo is public and deployed URL is live before submitting
                </div>
              </motion.div>
            </div>
          )
        ) : submitted ? (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mt-10 rounded-2xl border border-[#6952a2]/40 bg-[#1a1a2e] p-8 text-center"
          >
            {alreadySubmitted ? (
              <div className="mt-5 inline-flex rounded-full border border-[#f4e401]/30 bg-[#f4e401]/10 px-4 py-2 text-sm font-semibold text-[#f4e401]">
                Assessment Already Submitted
              </div>
            ) : null}

            <div className="mt-6">
              <div className="text-2xl font-extrabold text-[#f4e401]">Assessment Submitted</div>
              <div className="mt-2 text-sm font-medium" style={{ color: "rgba(241,220,186,0.7)" }}>
                Thanks for completing the assessment. Continue to the final step.
              </div>
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

