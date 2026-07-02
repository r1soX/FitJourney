"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Check,
  SkipForward,
  RefreshCw,
  ChevronRight,
  Info,
  Flame,
  HeartPulse,
  Snowflake,
  Dumbbell,
  Trophy,
} from "lucide-react";
import { updateExerciseLog, replaceExercise, finishWorkout } from "@/lib/actions";
import { formatClock, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import { RestTimer } from "./RestTimer";

interface SetData {
  reps: string;
  weight: string;
  done: boolean;
}

export interface RunnerLog {
  id: number;
  order: number;
  block: string;
  exerciseSlug: string;
  exerciseName: string;
  targetSets: number;
  targetReps: string;
  targetWeight: string;
  restSeconds: number;
  status: string;
  note: string;
  technique: string;
  tips: string;
  muscleGroup: string;
  equipment: string;
  sets: SetData[];
  alternatives: { slug: string; name: string }[];
}

export interface RunnerData {
  sessionId: number;
  planTitle: string;
  planFocus: string;
  status: string;
  planSequence: number;
  startedAtISO: string | null;
  logs: RunnerLog[];
}

const BLOCK_ICON: Record<string, React.ReactNode> = {
  warmup: <Flame size={16} className="text-amber-300" />,
  cardio: <HeartPulse size={16} className="text-rose-300" />,
  cooldown: <Snowflake size={16} className="text-sky-300" />,
};

function blockLabel(block: string) {
  if (block === "warmup") return "Разминка";
  if (block === "cardio") return "Кардио";
  if (block === "cooldown") return "Заминка";
  if (block === "finisher") return "Финишер";
  if (block === "core") return "Кор";
  if (block.startsWith("superset")) return "Суперсет";
  return "Упражнение";
}

export function WorkoutRunner({ data }: { data: RunnerData }) {
  const router = useRouter();
  const [logs, setLogs] = useState<RunnerLog[]>(data.logs);
  const firstPending = data.logs.findIndex(
    (l) => l.status === "pending",
  );
  const [index, setIndex] = useState(firstPending === -1 ? 0 : firstPending);
  const [resting, setResting] = useState(false);
  const [showFinish, setShowFinish] = useState(false);
  const [showTechnique, setShowTechnique] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const startTime = useRef(
    data.startedAtISO ? new Date(data.startedAtISO).getTime() : Date.now(),
  );

  // Таймер тренировки
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const current = logs[index];
  const doneCount = logs.filter(
    (l) => l.status === "completed" || l.status === "skipped" || l.status === "replaced",
  ).length;
  const progress = (doneCount / logs.length) * 100;
  const isTimed = current && ["warmup", "cardio", "cooldown"].includes(current.block);

  function persist(log: RunnerLog, patch: Partial<{ status: string; setsData: SetData[] }>) {
    updateExerciseLog(log.id, patch).catch(() => {});
  }

  function updateSet(setIdx: number, patch: Partial<SetData>) {
    setLogs((prev) => {
      const next = [...prev];
      const log = { ...next[index] };
      const sets = [...log.sets];
      sets[setIdx] = { ...sets[setIdx], ...patch };
      log.sets = sets;
      next[index] = log;
      persist(log, { setsData: sets });
      return next;
    });
  }

  function toggleSetDone(setIdx: number) {
    const wasDone = logs[index].sets[setIdx].done;
    updateSet(setIdx, { done: !wasDone });
    // если отметили выполненным и это не последний подход — запускаем отдых
    if (!wasDone && setIdx < logs[index].sets.length - 1 && current.restSeconds > 0) {
      setResting(true);
    }
  }

  function advance() {
    setResting(false);
    setShowTechnique(false);
    // ищем следующий незавершённый
    const nextIdx = logs.findIndex(
      (l, i) => i > index && l.status === "pending",
    );
    if (nextIdx === -1) {
      // проверим есть ли вообще незавершённые до текущего
      const anyPending = logs.findIndex((l) => l.status === "pending");
      if (anyPending === -1) {
        setShowFinish(true);
      } else {
        setIndex(anyPending);
      }
    } else {
      setIndex(nextIdx);
    }
  }

  function completeExercise() {
    setLogs((prev) => {
      const next = [...prev];
      const log = { ...next[index], status: "completed" };
      next[index] = log;
      persist(log, { status: "completed", setsData: log.sets });
      return next;
    });
    advance();
  }

  function skipExercise() {
    setLogs((prev) => {
      const next = [...prev];
      const log = { ...next[index], status: "skipped" };
      next[index] = log;
      persist(log, { status: "skipped" });
      return next;
    });
    advance();
  }

  async function doReplace(slug: string, name: string) {
    setShowReplace(false);
    setLogs((prev) => {
      const next = [...prev];
      const log = { ...next[index], exerciseSlug: slug, exerciseName: name };
      next[index] = log;
      return next;
    });
    await replaceExercise(logs[index].id, slug).catch(() => {});
  }

  if (data.status === "completed" || showFinish) {
    return (
      <FinishView
        data={data}
        logs={logs}
        elapsed={elapsed}
        readOnly={data.status === "completed"}
        onSubmit={async (form) => {
          await finishWorkout(data.sessionId, {
            ...form,
            durationSec: elapsed,
          });
          router.push("/");
          router.refresh();
        }}
        onBack={() => setShowFinish(false)}
      />
    );
  }

  if (!current) return null;

  return (
    <div className="min-h-[100dvh]">
      {/* Верхняя панель */}
      <div className="sticky top-0 z-20 -mx-4 bg-ink-950/80 px-4 pb-3 pt-safe backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link
            href={`/program/${data.planSequence}`}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5"
          >
            <X size={18} />
          </Link>
          <div className="flex-1">
            <div className="text-sm font-semibold">{data.planTitle}</div>
            <div className="text-xs text-white/40">
              {doneCount} / {logs.length} · {formatDuration(elapsed)}
            </div>
          </div>
          <button
            onClick={() => setShowFinish(true)}
            className="rounded-xl border border-accent/30 bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent-soft active:scale-95"
          >
            Завершить
          </button>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-soft to-accent-deep transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="pt-4"
        >
          <div className="mb-2 flex items-center gap-2">
            <span className="chip">
              {BLOCK_ICON[current.block] ?? <Dumbbell size={14} className="text-accent-soft" />}
              {blockLabel(current.block)}
            </span>
            <span className="text-xs text-white/35">
              {current.muscleGroup} · {current.equipment}
            </span>
          </div>

          <h1 className="text-3xl font-bold leading-tight tracking-tight text-balance">
            {current.exerciseName}
          </h1>

          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() => setShowTechnique((s) => !s)}
              className="chip active:scale-95"
            >
              <Info size={14} /> Техника
            </button>
            {current.alternatives.length > 0 && !isTimed && (
              <button
                onClick={() => setShowReplace(true)}
                className="chip active:scale-95"
              >
                <RefreshCw size={14} /> Заменить
              </button>
            )}
          </div>

          <AnimatePresence>
            {showTechnique && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="glass mt-3 space-y-2 p-4 text-sm leading-relaxed text-white/70">
                  <p>{current.technique}</p>
                  {current.tips && (
                    <p className="text-xs text-accent-soft/90">💡 {current.tips}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {current.note && (
            <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60">
              {current.note}
            </p>
          )}

          {/* Тело: подходы или таймер */}
          {isTimed ? (
            <TimedBlock log={current} />
          ) : (
            <div className="mt-4 space-y-2">
              <div className="grid grid-cols-[36px_1fr_1fr_44px] gap-2 px-1 text-[10px] uppercase tracking-wider text-white/35">
                <span>#</span>
                <span>Повт.</span>
                <span>Вес</span>
                <span className="text-center">✓</span>
              </div>
              {current.sets.map((set, i) => (
                <div
                  key={i}
                  className={cn(
                    "grid grid-cols-[36px_1fr_1fr_44px] items-center gap-2 rounded-2xl border p-2 transition-colors",
                    set.done
                      ? "border-emerald-500/25 bg-emerald-500/10"
                      : "border-white/10 bg-white/[0.03]",
                  )}
                >
                  <span className="text-center text-sm font-bold text-white/50">{i + 1}</span>
                  <input
                    inputMode="numeric"
                    value={set.reps}
                    onChange={(e) => updateSet(i, { reps: e.target.value })}
                    placeholder={current.targetReps}
                    className="h-10 rounded-xl border border-white/10 bg-white/[0.04] px-2 text-center text-sm outline-none focus:border-accent/50"
                  />
                  <input
                    inputMode="decimal"
                    value={set.weight}
                    onChange={(e) => updateSet(i, { weight: e.target.value })}
                    placeholder="кг"
                    className="h-10 rounded-xl border border-white/10 bg-white/[0.04] px-2 text-center text-sm outline-none focus:border-accent/50"
                  />
                  <button
                    onClick={() => toggleSetDone(i)}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl transition-all active:scale-90",
                      set.done
                        ? "bg-emerald-500 text-white"
                        : "border border-white/15 bg-white/5 text-white/40",
                    )}
                  >
                    <Check size={18} strokeWidth={3} />
                  </button>
                </div>
              ))}
              <p className="px-1 pt-1 text-xs text-white/40">
                Ориентир по весу: {current.targetWeight}
                {current.restSeconds > 0 && ` · отдых ${formatClock(current.restSeconds)}`}
              </p>
            </div>
          )}

          {/* Следующее упражнение */}
          {logs[index + 1] && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-2.5 text-xs text-white/40">
              <ChevronRight size={14} />
              Далее: <span className="text-white/60">{logs[index + 1].exerciseName}</span>
            </div>
          )}

          {/* Действия */}
          <div className="mt-5 flex gap-3">
            <button onClick={skipExercise} className="btn-ghost flex-1">
              <SkipForward size={18} /> Пропустить
            </button>
            <button onClick={completeExercise} className="btn-primary flex-[2]">
              <Check size={18} strokeWidth={2.5} /> Готово
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {resting && current.restSeconds > 0 && (
        <RestTimer
          seconds={current.restSeconds}
          onDone={() => setResting(false)}
          onSkip={() => setResting(false)}
        />
      )}

      {/* Замена упражнения */}
      <AnimatePresence>
        {showReplace && (
          <ReplaceSheet
            alternatives={current.alternatives}
            onClose={() => setShowReplace(false)}
            onPick={doReplace}
          />
        )}
      </AnimatePresence>

      <div className="h-24" />
    </div>
  );
}

function TimedBlock({ log }: { log: RunnerLog }) {
  const initial = useMemo(() => {
    const m = log.targetReps ? log.targetReps.match(/(\d+)\s*мин/) : null;
    return m ? parseInt(m[1], 10) * 60 : 0;
  }, [log.targetReps]);
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(initial);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          setRunning(false);
          if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  return (
    <div className="glass mt-4 flex flex-col items-center p-6">
      <div className="text-xs uppercase tracking-wider text-white/40">
        {log.targetReps || "Выполни по самочувствию"}
      </div>
      {initial > 0 ? (
        <>
          <div className="my-3 text-5xl font-bold tabular">{formatClock(Math.max(0, remaining))}</div>
          <div className="flex gap-3">
            <button
              onClick={() => setRunning((r) => !r)}
              className="btn-ghost px-6"
            >
              {running ? "Пауза" : remaining === 0 ? "Заново" : "Старт"}
            </button>
            {remaining === 0 && (
              <button
                onClick={() => {
                  setRemaining(initial);
                }}
                className="btn-ghost"
              >
                Сброс
              </button>
            )}
          </div>
        </>
      ) : (
        <p className="mt-2 text-center text-sm text-white/60">
          Выполни это упражнение и нажми «Готово».
        </p>
      )}
    </div>
  );
}

function ReplaceSheet({
  alternatives,
  onClose,
  onPick,
}: {
  alternatives: { slug: string; name: string }[];
  onClose: () => void;
  onPick: (slug: string, name: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="glass-strong w-full max-w-md rounded-b-none p-5 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
        <h3 className="mb-3 text-lg font-bold">Заменить упражнение</h3>
        <div className="space-y-2">
          {alternatives.map((a) => (
            <button
              key={a.slug}
              onClick={() => onPick(a.slug, a.name)}
              className="glass flex w-full items-center justify-between p-4 text-left active:scale-[0.98]"
            >
              <span className="font-medium">{a.name}</span>
              <RefreshCw size={16} className="text-accent-soft" />
            </button>
          ))}
        </div>
        <button onClick={onClose} className="btn-ghost mt-4 w-full">
          Отмена
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Экран завершения
// ─────────────────────────────────────────────
function FinishView({
  data,
  logs,
  elapsed,
  readOnly,
  onSubmit,
  onBack,
}: {
  data: RunnerData;
  logs: RunnerLog[];
  elapsed: number;
  readOnly: boolean;
  onSubmit: (form: {
    notes: string;
    feelings: string;
    difficulty: number | null;
    mood: number | null;
    pain: number | null;
  }) => Promise<void>;
  onBack: () => void;
}) {
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const [pain, setPain] = useState<number | null>(null);
  const [feelings, setFeelings] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const completed = logs.filter((l) => l.status === "completed").length;

  async function submit() {
    setSaving(true);
    await onSubmit({ notes, feelings, difficulty, mood, pain });
  }

  return (
    <div className="min-h-[100dvh] pt-safe">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="mb-6 mt-6 flex flex-col items-center text-center"
      >
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-glow">
          <Trophy size={38} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold">
          {readOnly ? "Тренировка выполнена" : "Отличная работа!"}
        </h1>
        <p className="mt-1 text-sm text-white/50">{data.planTitle}</p>
        <div className="mt-4 flex gap-6">
          <div>
            <div className="text-2xl font-bold tabular text-accent-soft">{completed}</div>
            <div className="text-xs text-white/40">упражнений</div>
          </div>
          <div>
            <div className="text-2xl font-bold tabular">{formatDuration(elapsed)}</div>
            <div className="text-xs text-white/40">длительность</div>
          </div>
        </div>
      </motion.div>

      {readOnly ? (
        <div className="space-y-3">
          {logs.map((l) => (
            <div key={l.id} className="glass flex items-center justify-between p-3.5">
              <span className="text-sm">{l.exerciseName}</span>
              <span
                className={cn(
                  "text-xs font-medium",
                  l.status === "completed"
                    ? "text-emerald-400"
                    : l.status === "skipped"
                      ? "text-amber-400"
                      : "text-white/40",
                )}
              >
                {l.status === "completed"
                  ? "выполнено"
                  : l.status === "skipped"
                    ? "пропущено"
                    : l.status === "replaced"
                      ? "заменено"
                      : "—"}
              </span>
            </div>
          ))}
          <Link href="/" className="btn-primary mt-4 w-full">
            На главную
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          <Scale
            label="Сложность"
            value={difficulty}
            onChange={setDifficulty}
            labels={["Легко", "", "Норм", "", "Тяжело"]}
          />
          <Scale
            label="Настроение"
            value={mood}
            onChange={setMood}
            labels={["😞", "😕", "😐", "🙂", "😄"]}
            emoji
          />
          <Scale
            label="Боль / дискомфорт"
            value={pain}
            onChange={setPain}
            count={6}
            zeroBased
            labels={["Нет", "", "", "", "", "Сильная"]}
          />

          <div>
            <label className="label-muted mb-2 block">Ощущения</label>
            <textarea
              value={feelings}
              onChange={(e) => setFeelings(e.target.value)}
              placeholder="Как прошла тренировка? Что чувствовал?"
              rows={2}
              className="input-field resize-none"
            />
          </div>
          <div>
            <label className="label-muted mb-2 block">Заметки</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Рабочие веса, что улучшить в следующий раз..."
              rows={2}
              className="input-field resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onBack} className="btn-ghost flex-1">
              Назад
            </button>
            <button onClick={submit} disabled={saving} className="btn-primary flex-[2]">
              {saving ? "Сохранение..." : "Сохранить тренировку"}
            </button>
          </div>
        </div>
      )}
      <div className="h-8" />
    </div>
  );
}

function Scale({
  label,
  value,
  onChange,
  labels,
  count = 5,
  zeroBased = false,
  emoji = false,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
  labels: string[];
  count?: number;
  zeroBased?: boolean;
  emoji?: boolean;
}) {
  return (
    <div>
      <label className="label-muted mb-2 block">{label}</label>
      <div className="flex gap-2">
        {Array.from({ length: count }, (_, i) => {
          const v = zeroBased ? i : i + 1;
          const active = value === v;
          return (
            <button
              key={v}
              onClick={() => onChange(v)}
              className={cn(
                "flex h-12 flex-1 flex-col items-center justify-center rounded-2xl border text-sm font-semibold transition-all active:scale-95",
                active
                  ? "border-accent/40 bg-accent/20 text-accent-soft"
                  : "border-white/10 bg-white/[0.03] text-white/50",
              )}
            >
              <span className={emoji ? "text-xl" : ""}>{emoji ? labels[i] : v}</span>
            </button>
          );
        })}
      </div>
      {!emoji && (
        <div className="mt-1 flex justify-between px-1 text-[10px] text-white/30">
          <span>{labels[0]}</span>
          <span>{labels[labels.length - 1]}</span>
        </div>
      )}
    </div>
  );
}
