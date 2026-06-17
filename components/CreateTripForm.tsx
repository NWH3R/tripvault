"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function CreateTripForm() {
  const router = useRouter();
  const [tripName, setTripName] = useState("");
  const [unlockAt, setUnlockAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const minDateTime = new Date(Date.now() + 60_000).toISOString().slice(0, 16);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripName.trim() || !unlockAt) return;

    setLoading(true);
    setError("");

    try {
      const { data, error: dbError } = await supabase
        .from("trips")
        .insert({
          name: tripName.trim(),
          unlock_at: new Date(unlockAt).toISOString(),
        })
        .select()
        .single();

      if (dbError) throw dbError;
      setCreatedId(data.id);
    } catch {
      setError(
        "Failed to create trip. Please check your connection and try again."
      );
      setLoading(false);
    }
  };

  const shareUrl =
    createdId && typeof window !== "undefined"
      ? `${window.location.origin}/trip/${createdId}`
      : createdId
      ? `/trip/${createdId}`
      : "";

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Success screen ── */
  if (createdId) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="text-6xl mb-4 select-none"
            >
              🎉
            </motion.div>
            <h1 className="text-3xl font-black text-white mb-2">
              Vault Created!
            </h1>
            <p className="text-white/50 mb-8 text-sm">
              Share this link with your crew
            </p>

            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 mb-5 font-mono text-sm text-white/70 break-all text-left">
              {shareUrl}
            </div>

            <div className="flex flex-col gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={copyLink}
                className={`w-full font-bold py-4 rounded-2xl transition-colors duration-200 text-white ${
                  copied ? "bg-green-600" : "bg-indigo-600 hover:bg-indigo-500"
                }`}
              >
                {copied ? "✓ Copied!" : "Copy Link"}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push(`/trip/${createdId}`)}
                className="w-full font-bold py-4 rounded-2xl border border-white/20 text-white/70 hover:bg-white/5 transition-all duration-200"
              >
                Go to Trip →
              </motion.button>
            </div>
          </div>
        </motion.div>
      </main>
    );
  }

  /* ── Creation form ── */
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center mb-8">
          <Link
            href="/"
            className="text-white/40 hover:text-white transition-colors font-medium text-sm"
          >
            ← Back home
          </Link>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3 select-none">🗓️</div>
            <h1 className="text-3xl font-black text-white mb-2">
              New Trip Vault
            </h1>
            <p className="text-white/40 text-sm">
              Set the unlock date and share the link with your crew
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-white/60 mb-2">
                Trip Name
              </label>
              <input
                type="text"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                placeholder="e.g. Barcelona Summer 2025"
                required
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/25 focus:border-indigo-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/60 mb-2">
                Unlock Date &amp; Time
              </label>
              <input
                type="datetime-local"
                value={unlockAt}
                onChange={(e) => setUnlockAt(e.target.value)}
                min={minDateTime}
                required
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:border-indigo-500 focus:outline-none transition-colors [color-scheme:dark]"
              />
              <p className="text-xs text-white/25 mt-1">
                Photos stay hidden until this exact moment
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <motion.button
              type="submit"
              disabled={loading || !tripName.trim() || !unlockAt}
              whileHover={!loading ? { scale: 1.05 } : {}}
              whileTap={!loading ? { scale: 0.97 } : {}}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg py-4 rounded-xl transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Creating…
                </span>
              ) : (
                "Create Vault ✨"
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </main>
  );
}
