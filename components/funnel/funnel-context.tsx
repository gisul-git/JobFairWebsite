"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import type { IUser } from "@/types";

export type FunnelStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type FunnelUser = (IUser & { _id?: string; id?: string }) | null;

type FunnelState = {
  currentStep: FunnelStep;
  completedSteps: number[];
  userId: string | null;
  user: FunnelUser;
  setUser: (u: FunnelUser) => void;
  setUserId: (id: string | null) => void;
  goToStep: (step: FunnelStep, opts?: { scroll?: boolean }) => void;
  markCompleted: (step: number) => void;
};

const FunnelCtx = createContext<FunnelState | null>(null);

const LS_KEYS = {
  userId: "gisul:userId",
  user: "gisul:user",
  currentStep: "gisul:currentStep",
  completedSteps: "gisul:completedSteps",
} as const;

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function FunnelProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState<FunnelStep>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<FunnelUser>(null);

  const stepRefs = useRef<Map<number, HTMLElement>>(new Map());

  const registerStepEl = useCallback((step: number, el: HTMLElement | null) => {
    const map = stepRefs.current;
    if (!el) {
      map.delete(step);
      return;
    }
    map.set(step, el);
  }, []);

  const scrollToStep = useCallback((step: number) => {
    const el = stepRefs.current.get(step);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const goToStep = useCallback(
    (step: FunnelStep, opts?: { scroll?: boolean }) => {
      setCurrentStep(step);
      if (opts?.scroll !== false) {
        requestAnimationFrame(() => scrollToStep(step));
      }
    },
    [scrollToStep]
  );

  const markCompleted = useCallback((step: number) => {
    setCompletedSteps((prev) => (prev.includes(step) ? prev : [...prev, step].sort((a, b) => a - b)));
  }, []);

  useEffect(() => {
    const storedUserId = localStorage.getItem(LS_KEYS.userId);
    const storedUser = safeParseJson<FunnelUser>(localStorage.getItem(LS_KEYS.user));
    const storedStep = safeParseJson<number>(localStorage.getItem(LS_KEYS.currentStep));
    const storedCompleted = safeParseJson<number[]>(localStorage.getItem(LS_KEYS.completedSteps));

    if (storedUserId) setUserId(storedUserId);
    if (storedUser) setUser(storedUser);
    if (storedStep && storedStep >= 1 && storedStep <= 8) setCurrentStep(storedStep as FunnelStep);
    if (storedCompleted && Array.isArray(storedCompleted)) setCompletedSteps(storedCompleted);
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.currentStep, JSON.stringify(currentStep));
  }, [currentStep]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.completedSteps, JSON.stringify(completedSteps));
  }, [completedSteps]);

  useEffect(() => {
    if (userId) localStorage.setItem(LS_KEYS.userId, userId);
    else localStorage.removeItem(LS_KEYS.userId);
  }, [userId]);

  useEffect(() => {
    if (user) localStorage.setItem(LS_KEYS.user, JSON.stringify(user));
    else localStorage.removeItem(LS_KEYS.user);
  }, [user]);

  const value = useMemo<FunnelState>(
    () => ({
      currentStep,
      completedSteps,
      userId,
      user,
      setUser,
      setUserId,
      goToStep,
      markCompleted,
    }),
    [completedSteps, currentStep, goToStep, markCompleted, user, userId]
  );

  return (
    <FunnelCtx.Provider value={value}>
      {/* Step anchor registration helper */}
      <div
        style={{ display: "contents" }}
        data-funnel-register
        ref={(node) => {
          // no-op; keeps React happy for "contents"
          void node;
        }}
      />
      {children}
      <RegisterSteps registerStepEl={registerStepEl} />
    </FunnelCtx.Provider>
  );
}

function RegisterSteps({ registerStepEl }: { registerStepEl: (step: number, el: HTMLElement | null) => void }) {
  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>("[data-step]");
    nodes.forEach((el) => {
      const step = Number(el.dataset.step);
      if (Number.isFinite(step)) registerStepEl(step, el);
    });

    return () => {
      nodes.forEach((el) => {
        const step = Number(el.dataset.step);
        if (Number.isFinite(step)) registerStepEl(step, null);
      });
    };
  }, [registerStepEl]);

  return null;
}

export function useFunnel() {
  const ctx = useContext(FunnelCtx);
  if (!ctx) throw new Error("useFunnel must be used within FunnelProvider");
  return ctx;
}

