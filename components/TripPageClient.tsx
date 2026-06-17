"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Trip } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import CountdownTimer from "./CountdownTimer";
import PhotoUpload from "./PhotoUpload";
import PhotoGallery from "./PhotoGallery";
import ConfettiEffect from "./ConfettiEffect";

interface TripPageClientProps {
  trip: Trip;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDatetimeLocal(isoStr: string) {
  const d = new Date(isoStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function TripPageClient({ trip }: TripPageClientProps) {
  const [unlockAt, setUnlockAt] = useState(trip.unlock_at);
  const [isUnlocked, setIsUnlocked] = useState(
    () => new Date() >= new Date(trip.unlock_at)
  );
  const [photoCount, setPhotoCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [editingReveal, setEditingReveal] = useState(false);
  const [newRevealValue, setNewRevealValue] = useState("");
  const [savingReveal, setSavingReveal] = useState(false);

  const fetchCount = useCallback(async () => {
    const { count, error } = await supabase
      .from("photos")
      .select("*", { count: "exact", head: true })
      .eq("trip_id", trip.id);
    if (error) console.error("[fetchCount] Error:", error);
    const actual = count ?? 0;
    console.log(`[fetchCount] trip=${trip.id} db_count=${actual}`);
    setPhotoCount(actual);
  }, [trip.id]);

  useEffect(() => {
    if (!isUnlocked) fetchCount();
  }, [isUnlocked, fetchCount]);

  const handleUnlock = useCallback(() => {
    setIsUnlocked(true);
    setShowConfetti(true);
    setJustUnlocked(true);
    setTimeout(() => setJustUnlocked(false), 1200);
  }, []);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openEditReveal = () => {
    setNewRevealValue(toDatetimeLocal(unlockAt));
    setEditingReveal(true);
  };

  const saveRevealTime = async () => {
    if (!newRevealValue) return;
    setSavingReveal(true);

    const newIso = new Date(newRevealValue).toISOString();

    const { error } = await supabase
      .from("trips")
      .update({ unlock_at: newIso })
      .eq("id", trip.id);

    if (error) {
      console.error("[saveRevealTime] Error:", error);
      setSavingReveal(false);
      return;
    }

    setUnlockAt(newIso);
    setEditingReveal(false);
    setSavingReveal(false);

    if (new Date() >= new Date(newIso)) {
      handleUnlock();
    }
  };

  /* ── Unlocked view ── */
  if (isUnlocked) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] relative z-10">
        {showConfetti && <ConfettiEffect />}

        <AnimatePresence>
          {justUnlocked && (
            <motion.div
              key="flash"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, times: [0, 0.25, 1] }}
              className="fixed inset-0 bg-indigo-500/30 z-50 pointer-events-none"
            />
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-b from-indigo-950/60 to-transparent pt-16 pb-12 px-4 text-center"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="text-5xl mb-4 select-none"
          >
            🎉
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-black text-white mb-2"
          >
            The wait is over!
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl font-semibold text-white/60"
          >
            {trip.name}
          </motion.p>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-white/30 mt-1"
          >
            Unlocked {formatDate(unlockAt)}
          </motion.p>
        </motion.div>

        <div className="max-w-2xl mx-auto px-4 py-8">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-2xl font-black text-white mb-6"
          >
            All the memories 📸
          </motion.h2>
          <PhotoGallery tripId={trip.id} />
        </div>
      </main>
    );
  }

  /* ── Locked view ── */
  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-16 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="px-4 pb-12 pt-14 text-center"
      >
        <div className="max-w-lg mx-auto">
          {/* Pulsing lock glow */}
          <div className="relative inline-flex items-center justify-center mb-4">
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 0px 0px rgba(99,102,241,0)",
                  "0 0 50px 20px rgba(99,102,241,0.25)",
                  "0 0 0px 0px rgba(99,102,241,0)",
                ],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="text-5xl select-none p-4 rounded-full"
            >
              🔒
            </motion.div>
          </div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-black text-white mb-1"
          >
            {trip.name}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-white/35 mb-10"
          >
            Photos are hidden until {formatDate(unlockAt)}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <CountdownTimer
              key={unlockAt}
              unlockAt={unlockAt}
              onUnlock={handleUnlock}
            />
          </motion.div>

          {/* Change reveal time */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="mt-6"
          >
            <AnimatePresence mode="wait">
              {editingReveal ? (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-3"
                >
                  <p className="text-sm font-semibold text-white/50">
                    Change reveal time
                  </p>
                  <input
                    type="datetime-local"
                    value={newRevealValue}
                    onChange={(e) => setNewRevealValue(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:border-indigo-500 focus:outline-none transition-colors [color-scheme:dark]"
                  />
                  <div className="flex gap-2">
                    <motion.button
                      onClick={saveRevealTime}
                      disabled={savingReveal || !newRevealValue}
                      whileHover={!savingReveal ? { scale: 1.03 } : {}}
                      whileTap={!savingReveal ? { scale: 0.97 } : {}}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                    >
                      {savingReveal ? "Saving…" : "Save"}
                    </motion.button>
                    <button
                      onClick={() => setEditingReveal(false)}
                      className="px-4 py-2.5 rounded-xl border border-white/10 text-white/40 hover:text-white/70 text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  key="trigger"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={openEditReveal}
                  className="text-xs text-white/25 hover:text-white/50 transition-colors underline underline-offset-2"
                >
                  Change reveal time
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>

      <div className="max-w-lg mx-auto px-4 space-y-4">
        {/* Stats + copy link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4"
        >
          <div className="text-4xl select-none">📷</div>
          <div>
            <p className="text-3xl font-black text-white leading-none">
              {photoCount}
            </p>
            <p className="text-white/35 text-sm font-medium">
              {photoCount === 1 ? "photo" : "photos"} uploaded so far
            </p>
          </div>
          <motion.button
            onClick={copyLink}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 whitespace-nowrap ${
              copied
                ? "bg-green-600/20 text-green-400"
                : "bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30"
            }`}
          >
            {copied ? "✅ Copied!" : "🔗 Copy Link"}
          </motion.button>
        </motion.div>

        {/* Upload zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-5"
        >
          <h2 className="text-lg font-black text-white mb-4">
            Add your photos 📸
          </h2>
          <PhotoUpload tripId={trip.id} onUploadComplete={fetchCount} />
        </motion.div>
      </div>
    </main>
  );
}
