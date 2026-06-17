"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CountdownTimerProps {
  unlockAt: string;
  onUnlock: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(unlockAt: string): TimeLeft {
  const diff = Math.max(0, new Date(unlockAt).getTime() - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function FlipDigit({ value }: { value: number }) {
  const str = pad(value);
  return (
    <div className="relative overflow-hidden h-[52px] sm:h-[68px] flex items-center justify-center min-w-[60px] sm:min-w-[76px]">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={str}
          initial={{ y: -36, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 36, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          className="text-3xl sm:text-5xl font-black text-white tabular-nums leading-none absolute"
        >
          {str}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export default function CountdownTimer({
  unlockAt,
  onUnlock,
}: CountdownTimerProps) {
  const [time, setTime] = useState<TimeLeft>(() => getTimeLeft(unlockAt));

  const tick = useCallback(() => {
    const tl = getTimeLeft(unlockAt);
    setTime(tl);
    if (
      tl.days === 0 &&
      tl.hours === 0 &&
      tl.minutes === 0 &&
      tl.seconds === 0
    ) {
      onUnlock();
    }
  }, [unlockAt, onUnlock]);

  useEffect(() => {
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tick]);

  const units = [
    { label: "Days", value: time.days },
    { label: "Hours", value: time.hours },
    { label: "Min", value: time.minutes },
    { label: "Sec", value: time.seconds },
  ];

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {units.map(({ label, value }, i) => (
        <div key={label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className="bg-white/10 border border-white/10 backdrop-blur rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-center">
              <FlipDigit value={value} />
              <p className="text-xs font-semibold text-white/40 mt-1 uppercase tracking-wide">
                {label}
              </p>
            </div>
          </div>
          {i < units.length - 1 && (
            <span className="text-2xl sm:text-4xl font-black text-white/25 mx-1 mb-5">
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
