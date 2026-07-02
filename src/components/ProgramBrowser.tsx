"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Circle, Dot, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export interface PlanLite {
  id: number;
  sequence: number;
  month: number;
  weekOfProgram: number;
  weekOfMonth: number;
  dayOfWeek: number;
  phase: string;
  title: string;
  focus: string;
  estMinutes: number;
  isDeload: boolean;
  dateLabel: string;
  weekdayLabel: string;
  status: string;
}

export interface PhaseLite {
  name: string;
  months: [number, number];
  intro: string;
}

const WEEKDAY_LABEL: Record<number, string> = { 1: "Пн", 3: "Ср", 5: "Пт" };

function StatusIcon({ status }: { status: string }) {
  if (status === "completed")
    return <CheckCircle2 size={20} className="text-emerald-400" />;
  if (status === "missed") return <XCircle size={20} className="text-red-400" />;
  if (status === "skipped") return <XCircle size={20} className="text-amber-400" />;
  if (status === "today")
    return <Dot size={28} className="-m-1 text-accent-soft" strokeWidth={4} />;
  return <Circle size={20} className="text-white/20" />;
}

export function ProgramBrowser({
  plans,
  phases,
  initialMonth,
}: {
  plans: PlanLite[];
  phases: PhaseLite[];
  initialMonth: number;
}) {
  const [month, setMonth] = useState(initialMonth);
  const monthPlans = plans.filter((p) => p.month === month);
  const phase = phases.find((ph) => month >= ph.months[0] && month <= ph.months[1]);

  // группировка по неделям
  const weeks = Array.from(new Set(monthPlans.map((p) => p.weekOfProgram))).sort(
    (a, b) => a - b,
  );

  return (
    <div>
      {/* Переключатель месяцев */}
      <div className="-mx-4 mb-4 overflow-x-auto px-4 pb-1">
        <div className="flex gap-2">
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <button
              key={m}
              onClick={() => setMonth(m)}
              className={cn(
                "flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl border text-sm font-semibold transition-all active:scale-95",
                m === month
                  ? "border-accent/40 bg-accent/20 text-accent-soft shadow-glow"
                  : "border-white/10 bg-white/[0.04] text-white/50",
              )}
            >
              <span className="text-[9px] font-normal uppercase opacity-60">мес</span>
              {m}
            </button>
          ))}
        </div>
      </div>

      {phase && (
        <div className="glass mb-4 p-4">
          <div className="flex items-center gap-2">
            <Badge variant="accent">Фаза</Badge>
            <span className="font-semibold">{phase.name}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-white/60">{phase.intro}</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={month}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.25 }}
        >
          {weeks.map((week) => {
            const weekPlans = monthPlans.filter((p) => p.weekOfProgram === week);
            const isDeload = weekPlans[0]?.isDeload;
            return (
              <div key={week} className="mb-5">
                <div className="mb-2 flex items-center justify-between px-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
                    Неделя {week}
                  </span>
                  {isDeload && <Badge variant="purple">Разгрузочная</Badge>}
                </div>
                <div className="space-y-2">
                  {weekPlans.map((p) => (
                    <Link
                      key={p.id}
                      href={`/program/${p.sequence}`}
                      className="glass flex items-center gap-3 p-3.5 transition-all active:scale-[0.98]"
                    >
                      <StatusIcon status={p.status} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{p.title}</span>
                        </div>
                        <div className="truncate text-xs text-white/45">{p.focus}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-white/70">
                          {WEEKDAY_LABEL[p.dayOfWeek] ?? p.weekdayLabel}
                        </div>
                        <div className="text-[10px] text-white/40">{p.dateLabel}</div>
                      </div>
                      <ChevronRight size={16} className="text-white/25" />
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
