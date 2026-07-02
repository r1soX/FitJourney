"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, X, Timer } from "lucide-react";
import { formatClock } from "@/lib/format";

export function RestTimer({
  seconds,
  onDone,
  onSkip,
}: {
  seconds: number;
  onDone: () => void;
  onSkip: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const total = useRef(seconds);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([120, 60, 120]);
          }
          doneRef.current();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const pct = total.current > 0 ? (remaining / total.current) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong fixed inset-x-4 bottom-[calc(var(--nav-height)+var(--safe-bottom)+12px)] z-30 mx-auto max-w-md p-4"
    >
      <div className="flex items-center gap-4">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
          <svg className="absolute -rotate-90" width={64} height={64}>
            <circle cx={32} cy={32} r={28} fill="none" strokeWidth={5} className="stroke-white/10" />
            <circle
              cx={32}
              cy={32}
              r={28}
              fill="none"
              strokeWidth={5}
              strokeLinecap="round"
              stroke="#3b82f6"
              strokeDasharray={2 * Math.PI * 28}
              strokeDashoffset={2 * Math.PI * 28 * (1 - pct / 100)}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <Timer size={20} className="text-accent-soft" />
        </div>
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wider text-white/40">Отдых</div>
          <div className="text-3xl font-bold tabular">{formatClock(remaining)}</div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              setRemaining((r) => r + 15);
              total.current += 15;
            }}
            className="flex h-9 items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-medium active:scale-95"
          >
            <Plus size={14} /> 15с
          </button>
          <button
            onClick={onSkip}
            className="flex h-9 items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-medium active:scale-95"
          >
            <X size={14} /> Пропустить
          </button>
        </div>
      </div>
    </motion.div>
  );
}
