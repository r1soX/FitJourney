"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CalEvent {
  dateISO: string; // yyyy-mm-dd
  status: string;
  sequence: number;
  title: string;
}
export interface CalWeight {
  dateISO: string;
  weight: number;
}

const MONTHS = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];
const DOW = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const STATUS_COLOR: Record<string, string> = {
  completed: "bg-emerald-500",
  skipped: "bg-amber-500",
  missed: "bg-red-500",
  today: "bg-accent",
  upcoming: "bg-white/25",
};

function keyOf(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function CalendarView({
  events,
  weights,
  initialYear,
  initialMonth,
  unitLabel,
}: {
  events: CalEvent[];
  weights: CalWeight[];
  initialYear: number;
  initialMonth: number;
  unitLabel: string;
}) {
  const router = useRouter();
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);

  const eventMap = new Map(events.map((e) => [e.dateISO, e]));
  const weightMap = new Map(weights.map((w) => [w.dateISO, w.weight]));

  const first = new Date(year, month, 1);
  const startDow = (first.getDay() + 6) % 7; // 0 = Пн
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = keyOf(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function shift(dir: number) {
    let m = month + dir;
    let y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m);
    setYear(y);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => shift(-1)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 active:scale-90">
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold">
          {MONTHS[month]} {year}
        </h2>
        <button onClick={() => shift(1)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 active:scale-90">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="glass p-3">
        <div className="mb-2 grid grid-cols-7 gap-1">
          {DOW.map((d) => (
            <div key={d} className="py-1 text-center text-[10px] font-medium uppercase text-white/35">
              {d}
            </div>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${year}-${month}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-7 gap-1"
          >
            {cells.map((d, i) => {
              if (d === null) return <div key={i} />;
              const key = keyOf(year, month, d);
              const ev = eventMap.get(key);
              const w = weightMap.get(key);
              const isToday = key === todayKey;
              const status = isToday && ev && ev.status !== "completed" ? "today" : ev?.status;
              return (
                <button
                  key={i}
                  onClick={() => ev && router.push(`/program/${ev.sequence}`)}
                  className={cn(
                    "relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-all",
                    ev ? "active:scale-90" : "cursor-default",
                    isToday ? "border border-accent/50 bg-accent/10 font-bold" : "",
                  )}
                >
                  <span className={cn(isToday ? "text-accent-soft" : "text-white/80")}>{d}</span>
                  {status && (
                    <span className={cn("mt-0.5 h-1.5 w-1.5 rounded-full", STATUS_COLOR[status])} />
                  )}
                  {w !== undefined && (
                    <span className="absolute right-0.5 top-0.5 h-1 w-1 rounded-full bg-sky-400" />
                  )}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Легенда */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 px-1 text-xs text-white/50">
        <Legend color="bg-emerald-500" label="Выполнено" />
        <Legend color="bg-accent" label="Сегодня" />
        <Legend color="bg-white/25" label="Запланировано" />
        <Legend color="bg-red-500" label="Пропущено" />
        <Legend color="bg-sky-400" label="Замер веса" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", color)} /> {label}
    </span>
  );
}
