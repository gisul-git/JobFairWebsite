"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";

import type { IUser } from "@/types";

type Role = "BDE" | "Fullstack" | null;

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

function formatBytes(bytes: number) {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(2)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(1)} KB`;
}

function CloudUploadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 16V8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 11l4-4 4 4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 16.5c0-1.93 1.57-3.5 3.5-3.5h.7A5.5 5.5 0 0 1 18.7 14H19.5A2.5 2.5 0 1 1 19.5 19h-15A2.5 2.5 0 0 1 2 16.5z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-5-5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M14 2v5h5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
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

export default function Step3ResumeUpload(props: {
  userId: string | null;
  userData: Partial<IUser> & { _id?: string; id?: string };
  setUserData: (u: Partial<IUser> & { _id?: string; id?: string }) => void;
  setCurrentStep: (step: number) => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [roleError, setRoleError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [roleShake, setRoleShake] = useState(false);
  const roleShakeTimeoutRef = useRef<number | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);

  const [particles, setParticles] = useState<Particle[]>([]);

  const allowedExtensions = useMemo(() => ["pdf", "doc", "docx"], []);
  const maxBytes = 5 * 1024 * 1024;

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
    const role = props.userData?.role;
    if (role === "BDE" || role === "Fullstack") {
      setSelectedRole(role);
    }
  }, [props.userData]);

  function triggerRoleShake() {
    setRoleShake(true);
    if (roleShakeTimeoutRef.current) window.clearTimeout(roleShakeTimeoutRef.current);
    roleShakeTimeoutRef.current = window.setTimeout(() => {
      setRoleShake(false);
    }, 520);
  }

  function validateFile(file: File) {
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    if (!allowedExtensions.includes(ext)) return "Only PDF/DOC/DOCX files are allowed";
    if (file.size > maxBytes) return "File size must be 5MB or less";
    return null;
  }

  function handleFile(file: File) {
    setServerError(null);
    setRoleError(null);
    const nextError = validateFile(file);
    if (nextError) {
      setFileError(nextError);
      setSelectedFile(null);
      return;
    }
    setFileError(null);
    setSelectedFile(file);
  }

  function onPickFileClick() {
    fileInputRef.current?.click();
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    handleFile(file);
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function onDragLeave() {
    setDragOver(false);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    handleFile(file);
  }

  async function onUpload() {
    setServerError(null);
    if (!selectedRole) {
      setRoleError("Please select a role first");
      triggerRoleShake();
      return;
    }
    if (!selectedFile) {
      setFileError("File is required");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setFileError(null);
    setRoleError(null);

    const token = window.localStorage.getItem("gisul_token") ?? window.localStorage.getItem("gisul:sessionToken");
    if (!token) {
      setServerError("Missing session token. Please register again.");
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("role", selectedRole);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/resume/upload", true);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const pct = Math.round((event.loaded / event.total) * 100);
      setUploadProgress(pct);
    };

    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText) as any;
        if (xhr.status >= 200 && xhr.status < 300 && json?.ok && json?.data) {
          props.setUserData(json.data);
          setUploading(false);
          props.showToast("Resume uploaded successfully", "success");
          props.setCurrentStep(4);
          return;
        }
        throw new Error(json?.error ?? "Upload failed");
      } catch (e) {
        setServerError(e instanceof Error ? e.message : "Upload failed");
        setUploading(false);
      }
    };

    xhr.onerror = () => {
      setServerError("Upload failed");
      setUploading(false);
    };

    xhr.send(formData);
  }

  const roleCards: Array<{
    role: Exclude<Role, null>;
    title: string;
    subtitle: string;
    tag: string;
  }> = [
    { role: "BDE", title: "Business Development", subtitle: "Executive", tag: "MCQ Aptitude Test" },
    { role: "Fullstack", title: "Full Stack", subtitle: "Intern", tag: "Tech Assessment" },
  ];

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

      <div className="relative z-10 mx-auto w-full max-w-xl rounded-[24px] border border-[#6952a2]/35 bg-[#0d0d1a]/40 p-8 backdrop-blur-2xl">
        <div className="text-center">
          <div className="rounded-full border border-[#f4e401]/30 bg-[#f4e401]/10 px-4 py-2 text-center text-[12px] font-semibold tracking-[0.2em] text-[#f4e401]">
            Step 3 of 7
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-white sm:text-3xl">Upload Your Resume</h2>
          <p className="mt-3 text-sm sm:text-base" style={{ color: "rgba(241,220,186,0.7)" }}>
            Share your resume to be considered for roles in GISUL&apos;s partner network
          </p>
        </div>

        {props.userData?.resume?.uploaded ? (
          <div
            className="mt-8 rounded-2xl border p-6"
            style={{
              background: "rgba(34,197,94,0.10)",
              borderColor: "rgba(34,197,94,0.30)",
            }}
          >
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-[#22c55e]/15 p-3 text-[#22c55e]">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
                  <path
                    d="M20 6L9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-xl font-extrabold text-white">Resume Already Uploaded</div>
                <div className="mt-2 text-sm font-medium text-[#f1dcba]/80">
                  Filename: {props.userData.resume.filename ?? "Uploaded resume"}
                </div>
                <div className="mt-1 text-sm font-medium text-[#f1dcba]/80">
                  Role selected: {props.userData.role ?? "Not set"}
                </div>
              </div>
            </div>

            <motion.button
              type="button"
              whileHover={{ scale: 1.02, boxShadow: "0 0 60px rgba(244,228,1,0.55)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => props.setCurrentStep(4)}
              className="mt-6 w-full rounded-full px-8 py-4 text-[16px] font-bold text-[#1a1a2e]"
              style={{
                background: "#f4e401",
                boxShadow: "0 0 40px rgba(244,228,1,0.35)",
              }}
            >
              Continue to Next Step →
            </motion.button>
          </div>
        ) : (
          <>
        <div className="mt-8">
          <div className="mb-3 text-[13px] font-semibold" style={{ color: "rgba(241,220,186,0.6)" }}>
            Applying for
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {roleCards.map((c, idx) => {
              const isSelected = selectedRole === c.role;
              return (
                <motion.button
                  key={c.role}
                  type="button"
                  onClick={() => {
                    setSelectedRole(c.role);
                    setRoleError(null);
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, x: roleShake ? [0, -6, 6, -4, 4, 0] : 0 }}
                  transition={{ delay: idx * 0.15, duration: 0.35, ease: "easeOut" }}
                  className="relative flex-1 rounded-[16px] border px-5 py-4 text-left transition-colors"
                  style={{
                    background: isSelected ? "rgba(244,228,1,0.10)" : "#1a1a2e",
                    borderColor: isSelected ? "#f4e401" : "rgba(241,220,186,0.2)",
                    boxShadow: isSelected ? "0 0 20px rgba(244,228,1,0.2)" : undefined,
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div
                        className="truncate text-sm font-extrabold"
                        style={{ color: isSelected ? "#f4e401" : "white" }}
                      >
                        {c.title}
                      </div>
                      <div className="mt-1 text-sm font-semibold" style={{ color: "rgba(241,220,186,0.8)" }}>
                        {c.subtitle}
                      </div>
                      <div
                        className="mt-3 inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold"
                        style={{
                          borderColor: isSelected ? "#f4e401" : "rgba(241,220,186,0.25)",
                          color: isSelected ? "#f4e401" : "rgba(241,220,186,0.7)",
                          background: "rgba(0,0,0,0.15)",
                        }}
                      >
                        {c.tag}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {roleError ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-sm font-semibold" style={{ color: "#ff6b6b" }}>
              {roleError}
            </motion.div>
          ) : null}
        </div>

        <div className="mt-8">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={onInputChange}
          />

          {!selectedFile ? (
            <div
              onClick={onPickFileClick}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onPickFileClick();
              }}
              className="cursor-pointer rounded-[16px]"
              style={{
                border: dragOver ? "2px dashed rgba(244,228,1,1)" : "2px dashed rgba(105,82,162,0.4)",
                background: dragOver ? "rgba(244,228,1,0.05)" : "transparent",
                padding: 48,
                textAlign: "center",
              }}
            >
              <div className="mx-auto" style={{ color: "#6952a2" }}>
                <CloudUploadIcon className="mx-auto h-10 w-10 text-[#6952a2]" />
              </div>
              <div className="mt-4 text-[15px] font-bold text-white">Drag & drop your resume here</div>
              <div className="mt-2 text-sm font-semibold" style={{ color: "rgba(241,220,186,0.4)" }}>
                PDF or DOC, max 5MB
              </div>
              <div className="mt-3 text-sm font-semibold" style={{ color: "#f4e401" }}>
                <span role="button" tabIndex={-1} onClick={(e) => e.stopPropagation()}>
                  Browse Files
                </span>
              </div>
            </div>
          ) : (
            <div>
              <div
                className="inline-flex items-center gap-3 rounded-full border px-5 py-3"
                style={{
                  background: "rgba(105,82,162,0.2)",
                  borderColor: "#6952a2",
                  color: "white",
                }}
              >
                <FileIcon className="h-5 w-5 text-white" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">{selectedFile.name}</div>
                  <div className="text-xs font-semibold" style={{ color: "rgba(241,220,186,0.7)" }}>
                    {formatBytes(selectedFile.size)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setFileError(null);
                    setRoleError(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 text-sm font-semibold" style={{ color: "#f4e401" }}>
                <span role="button" tabIndex={0} onClick={onPickFileClick} onKeyDown={(e) => e.key === "Enter" && onPickFileClick()}>
                  Change file
                </span>
              </div>
            </div>
          )}

          {fileError ? (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 text-sm font-semibold"
              style={{ color: "#ff6b6b" }}
            >
              {fileError}
            </motion.div>
          ) : null}
        </div>

        <div className="mt-6">
          <motion.button
            type="button"
            whileHover={{
              scale: uploading ? 1 : 1.02,
              boxShadow: uploading ? undefined : "0 0 60px rgba(244,228,1,0.55)",
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => void onUpload()}
            disabled={uploading || !selectedFile}
            className="relative w-full overflow-hidden rounded-full px-8 py-4 text-[16px] font-bold text-[#1a1a2e]"
            style={{
              background: "#f4e401",
              boxShadow: "0 0 40px rgba(244,228,1,0.35)",
              opacity: !selectedFile ? 0.5 : uploading ? 0.85 : 1,
              pointerEvents: !selectedFile || uploading ? "none" : "auto",
              cursor: !selectedFile || uploading ? "not-allowed" : "pointer",
            }}
          >
            {uploading ? (
              <span className="relative z-10 inline-flex items-center justify-center gap-3">
                <Spinner />
                Uploading...
              </span>
            ) : (
              <span className="relative z-10">Upload Resume &amp; Continue →</span>
            )}
            <span className="button-shimmer absolute inset-y-0 -left-1/2 w-1/3" aria-hidden />
          </motion.button>

          {uploading ? (
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold" style={{ color: "rgba(241,220,186,0.7)" }}>
                  {uploadProgress}%
                </div>
                <div style={{ flex: 1 }} />
              </div>
              <div className="h-[6px] w-full rounded-full bg-[#f1dcba]/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[#f4e401]"
                  initial={{ width: "0%" }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.12, ease: "easeOut" }}
                  style={{ boxShadow: "0 0 8px rgba(244,228,1,0.5)" }}
                />
              </div>
            </div>
          ) : null}
        </div>

        {serverError ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 text-sm font-semibold text-center"
            style={{ color: "#ff6b6b" }}
          >
            {serverError}
          </motion.div>
        ) : null}
          </>
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
        .button-shimmer {
          background: linear-gradient(120deg, transparent 0%, rgba(255, 255, 255, 0.7) 50%, transparent 100%);
          animation: shimmer 3s ease-in-out infinite;
        }
        @keyframes gridDrift {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-40px);
          }
        }
        @keyframes shimmer {
          0% {
            transform: translateX(-200%);
            opacity: 0;
          }
          20% {
            opacity: 0.8;
          }
          60% {
            transform: translateX(450%);
            opacity: 0;
          }
          100% {
            transform: translateX(450%);
            opacity: 0;
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

