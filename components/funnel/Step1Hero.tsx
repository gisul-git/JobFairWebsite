"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

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

export default function Step1Hero(props: {
  setCurrentStep: (step: number) => void;
  onStart?: () => void;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);

  const words = useMemo(
    () => ["Unlock", "Free", "Certification.", "Get", "Hired."],
    []
  );

  useEffect(() => {
    const nextParticles: Particle[] = Array.from({ length: 140 }, (_, i) => ({
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
    const sectionEl = sectionRef.current;
    const cardEl = cardRef.current;
    if (!sectionEl || !cardEl) return;

    const onMove = (e: MouseEvent) => {
      const rect = sectionEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      const rotateY = Math.max(-8, Math.min(8, dx * 8));
      const rotateX = Math.max(-8, Math.min(8, -dy * 8));

      cardEl.style.transition = "transform 0.1s ease-out";
      cardEl.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const onLeave = () => {
      cardEl.style.transition = "transform 0.5s ease";
      cardEl.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
    };

    sectionEl.addEventListener("mousemove", onMove);
    sectionEl.addEventListener("mouseleave", onLeave);
    return () => {
      sectionEl.removeEventListener("mousemove", onMove);
      sectionEl.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12 sm:py-0"
      style={{ background: "#0d0d1a" }}
    >
      <div className="absolute inset-0 z-0" />
      <div className="grid-drift absolute inset-0 z-[1]" />

      <div className="pointer-events-none absolute inset-0 z-[3]">
        <div className="radial-main absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full sm:h-[800px] sm:w-[800px] md:h-[900px] md:w-[900px]" />
        <div className="radial-secondary absolute left-[58%] top-[38%] h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full sm:h-[400px] sm:w-[400px] md:h-[460px] md:w-[460px]" />
        <div className="aurora aurora-a absolute -left-[10%] top-[12%] h-[340px] w-[380px] rounded-full sm:h-[460px] sm:w-[520px] md:h-[540px] md:w-[620px]" />
        <div className="aurora aurora-b absolute -right-[12%] bottom-[2%] h-[360px] w-[420px] rounded-full sm:h-[520px] sm:w-[620px] md:h-[600px] md:w-[720px]" />
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

      <motion.img
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        src="/gisul-logo.png"
        alt="GISUL"
        className="absolute left-[-4px] top-[-20px] z-20 h-28 w-auto object-contain sm:left-[-10px] sm:top-[-30px] sm:h-40"
        loading="eager"
        draggable={false}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 mx-auto flex w-full items-center justify-center"
      >
        <div
          ref={cardRef}
          className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center px-4 py-10 text-center sm:px-6 sm:py-12"
        >
          <motion.h1
            className="max-w-5xl text-3xl font-black leading-tight text-white sm:text-5xl md:text-7xl"
            style={{ transformPerspective: 800 }}
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.08 } },
            }}
          >
            {words.map((word) => {
              const isGlow = word === "Free" || word === "Hired.";
              return (
                <motion.span
                  key={word}
                  className="mr-3 inline-block"
                  variants={{
                    hidden: { opacity: 0, y: 60, rotateX: -40 },
                    show: { opacity: 1, y: 0, rotateX: 0 },
                  }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  style={
                    isGlow
                      ? { color: "#f4e401", textShadow: "0 0 22px rgba(244,228,1,0.32)" }
                      : undefined
                  }
                >
                  {word}
                </motion.span>
              );
            })}
          </motion.h1>

          <motion.p
            className="mx-auto mt-6 max-w-2xl text-center text-base text-cream/80 sm:text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            Learn in minutes, prove your skills, and unlock real opportunities through GISUL’s partner network.
          </motion.p>

          <motion.button
            type="button"
            whileHover={{ scale: 1.05, boxShadow: "0 0 80px rgba(244,228,1,0.7)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (props.onStart) {
                props.onStart();
                return;
              }
              props.setCurrentStep(2);
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="relative mt-8 w-full max-w-[320px] overflow-hidden rounded-full px-8 py-4 text-base font-bold sm:mt-10 sm:w-auto sm:max-w-none sm:px-12 sm:py-5 sm:text-lg"
            style={{
              background: "#f4e401",
              color: "#1a1a2e",
              boxShadow: "0 0 40px rgba(244,228,1,0.4)",
            }}
          >
            <span className="relative z-10">Start Your Journey →</span>
            <span className="button-shimmer absolute inset-y-0 -left-1/2 w-1/3" />
          </motion.button>
        </div>
      </motion.div>

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

