"use client";

import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!res || res.error) {
        setError("Invalid credentials");
        return;
      }

      router.push("/admin");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-dark px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="mx-auto w-full max-w-md rounded-2xl border border-secondary/40 bg-secondary/10 p-8 backdrop-blur"
      >
        <h1 className="text-2xl font-extrabold text-white">Admin Login</h1>
        <p className="mt-2 text-cream/90">Sign in to access the GISUL admin dashboard.</p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-cream/90">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-cream/20 bg-transparent px-4 py-3 text-white outline-none focus:border-primary"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-cream/90">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="mt-2 w-full rounded-xl border border-cream/20 bg-transparent px-4 py-3 text-white outline-none focus:border-primary"
              placeholder="••••••••"
            />
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

        <motion.button
          type="button"
          whileHover={{ scale: loading ? 1 : 1.03 }}
          whileTap={{ scale: loading ? 1 : 0.99 }}
          disabled={loading}
          onClick={() => void onSubmit()}
          className="mt-6 w-full rounded-full bg-primary px-8 py-3 font-bold text-dark disabled:opacity-70"
        >
          {loading ? "Signing in..." : "Sign In"}
        </motion.button>
      </motion.div>
    </main>
  );
}

