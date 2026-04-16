"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import type { IUser } from "@/types";

type Platform = "google" | "linkedin" | "instagram";

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M7 11V8a5 5 0 0110 0v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 11h12v10H6V11z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
      <path
        d="M21.35 11.1H12v2.9h5.35c-.5 2.9-2.95 4.2-5.35 4.2a6.2 6.2 0 010-12.4c1.75 0 3.2.7 4.25 1.7l2-2A8.9 8.9 0 003 12a9 9 0 009 9c5.1 0 8.6-3.6 8.6-8.7 0-.6-.05-1.05-.25-1.2z"
        fill="#f4e401"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
      <path
        d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 23.5h4V7.5h-4v16zM8 7.5h3.8v2.2h.05c.53-1 1.83-2.2 3.76-2.2 4.02 0 4.76 2.65 4.76 6.1v9.9h-4v-8.8c0-2.1-.04-4.8-2.93-4.8-2.93 0-3.38 2.29-3.38 4.66v8.94H8V7.5z"
        fill="#0A66C2"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
      <path
        d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm10 2H7a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3z"
        fill="#f1dcba"
        opacity="0.9"
      />
      <path
        d="M12 7a5 5 0 110 10 5 5 0 010-10zm0 2a3 3 0 100 6 3 3 0 000-6z"
        fill="#6952a2"
      />
      <path d="M17.5 6.5a1 1 0 110 2 1 1 0 010-2z" fill="#f4e401" />
    </svg>
  );
}

export default function Step5Social(props: {
  userId: string | null;
  userData: Partial<IUser> & { _id?: string; id?: string };
  setUserData: (u: Partial<IUser> & { _id?: string; id?: string }) => void;
  setCurrentStep: (step: number) => void;
}) {
  const [loading, setLoading] = useState<Platform | null>(null);
  const [googlePendingMarkDone, setGooglePendingMarkDone] = useState(false);

  const status = useMemo(() => {
    return {
      google: Boolean(props.userData?.social?.google?.verified),
      linkedin: Boolean(props.userData?.social?.linkedin?.verified),
      instagram: Boolean(props.userData?.social?.instagram?.verified),
    };
  }, [props.userData]);

  const unlocked = {
    google: true,
    linkedin: status.google,
    instagram: status.google && status.linkedin,
  };

  async function verify(platform: Platform, accessToken?: string) {
    if (!props.userId) return;
    setLoading(platform);
    try {
      const res = await fetch("/api/social/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: props.userId, platform, accessToken }),
      });
      const json = (await res.json()) as any;
      if (res.ok && json?.ok) {
        // Update local user optimistic state
        const now = new Date().toISOString();
        const next: any = { ...props.userData, social: { ...(props.userData.social as any) } };
        if (platform === "google") next.social.google = { ...next.social.google, verified: true, verifiedAt: now };
        if (platform === "linkedin")
          next.social.linkedin = { ...next.social.linkedin, verified: true, verifiedAt: now, accessToken };
        if (platform === "instagram")
          next.social.instagram = { ...next.social.instagram, verified: true, verifiedAt: now, accessToken };
        props.setUserData(next);

        if (json.data?.allCompleted) {
          props.setCurrentStep(6);
        }
      }
    } finally {
      setLoading(null);
    }
  }

  function openNewTab(url: string) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function oauthPopup(provider: "linkedin" | "instagram") {
    const w = 520;
    const h = 720;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    window.open(`/api/auth/signin/${provider}`, "oauth", `width=${w},height=${h},left=${left},top=${top}`);
  }

  return (
    <section className="px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-6xl"
      >
        <h2 className="text-2xl font-bold text-white sm:text-3xl">Give Back to the Community</h2>
        <p className="mt-2 text-cream/90">
          Complete these quick actions to unlock the final steps. Each card unlocks the next.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          <ActionCard
            title="Google Review"
            icon={<GoogleIcon />}
            unlocked={unlocked.google}
            done={status.google}
            buttonLabel={status.google ? "Done!" : "Tap to Rate"}
            loading={loading === "google"}
            onClick={() => {
              if (!unlocked.google || status.google) return;
              openNewTab("https://www.google.com/maps");
              setGooglePendingMarkDone(true);
            }}
            extra={
              googlePendingMarkDone && !status.google ? (
                <button
                  type="button"
                  onClick={() => verify("google")}
                  className="mt-3 w-full rounded-full bg-primary px-4 py-2 text-sm font-bold text-dark"
                >
                  Mark as Done
                </button>
              ) : null
            }
          />

          <ActionCard
            title="LinkedIn Page Like"
            icon={<LinkedInIcon />}
            unlocked={unlocked.linkedin}
            done={status.linkedin}
            buttonLabel={status.linkedin ? "Done!" : "Like Page"}
            loading={loading === "linkedin"}
            onClick={() => {
              if (!unlocked.linkedin || status.linkedin) return;
              openNewTab("https://www.linkedin.com");
              oauthPopup("linkedin");
              // In a real OAuth callback you’d receive accessToken; placeholder user flow:
              void verify("linkedin", "placeholder-access-token");
            }}
          />

          <ActionCard
            title="Instagram Follow"
            icon={<InstagramIcon />}
            unlocked={unlocked.instagram}
            done={status.instagram}
            buttonLabel={status.instagram ? "Done!" : "Follow Us"}
            loading={loading === "instagram"}
            onClick={() => {
              if (!unlocked.instagram || status.instagram) return;
              openNewTab("https://www.instagram.com");
              oauthPopup("instagram");
              void verify("instagram", "placeholder-access-token");
            }}
          />
        </div>
      </motion.div>
    </section>
  );
}

function ActionCard(props: {
  title: string;
  icon: ReactNode;
  unlocked: boolean;
  done: boolean;
  buttonLabel: string;
  loading: boolean;
  onClick: () => void;
  extra?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-cream/20 bg-dark p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          {props.icon}
        </div>
        <div className="text-lg font-bold text-white">{props.title}</div>
      </div>

      <div className="mt-5">
        <button
          type="button"
          disabled={!props.unlocked || props.loading || props.done}
          onClick={props.onClick}
          className={[
            "w-full rounded-full px-4 py-3 text-sm font-bold transition-opacity",
            props.done ? "bg-emerald-500/20 text-emerald-200" : "bg-primary text-dark",
            !props.unlocked ? "opacity-50" : "",
          ].join(" ")}
        >
          <span className="inline-flex items-center justify-center gap-2">
            {props.done ? <CheckIcon className="h-5 w-5 text-emerald-200" /> : null}
            {props.buttonLabel}
          </span>
        </button>
        {props.extra}
      </div>

      {!props.unlocked ? (
        <div className="absolute inset-0 flex items-center justify-center bg-dark/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-cream/90">
            <LockIcon className="h-4 w-4 text-cream/80" />
            Locked
          </div>
        </div>
      ) : null}
    </div>
  );
}

