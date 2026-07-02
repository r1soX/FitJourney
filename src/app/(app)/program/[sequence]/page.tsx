import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ChevronLeft,
  Flame,
  Snowflake,
  HeartPulse,
  Dumbbell,
  Timer,
  Repeat,
  Weight,
  Info,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getUser, planDate } from "@/lib/data";
import { weekdayFromNumber, formatDateFull, formatClock } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FadeIn } from "@/components/ui/Motion";
import { StartWorkoutButton } from "@/components/StartWorkoutButton";

export const dynamic = "force-dynamic";

const BLOCK_LABEL: Record<string, string> = {
  "superset-a": "Суперсет",
  "superset-b": "Суперсет",
  finisher: "Финишер",
  core: "Кор",
};

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ sequence: string }>;
}) {
  const { sequence } = await params;
  const seq = Number(sequence);
  const user = await getUser();
  if (!user) redirect("/login");

  const plan = await prisma.workoutPlan.findUnique({
    where: { sequence: seq },
    include: {
      exercises: { orderBy: { order: "asc" }, include: { exercise: true } },
      session: true,
    },
  });
  if (!plan) notFound();

  const date = planDate(user.programStartDate, plan.weekOfProgram, plan.dayOfWeek);
  const warmup = plan.exercises.filter((e) => e.block === "warmup");
  const cardio = plan.exercises.filter((e) => e.block === "cardio");
  const cooldown = plan.exercises.filter((e) => e.block === "cooldown");
  const strength = plan.exercises.filter(
    (e) => !["warmup", "cardio", "cooldown"].includes(e.block),
  );

  const session = plan.session;
  const isCompleted = session?.status === "completed";
  const inProgress = session?.status === "in_progress";

  return (
    <div>
      <FadeIn>
        <div className="mb-4 mt-2 flex items-center gap-2">
          <Link href="/program" className="btn-ghost h-10 w-10 !px-0">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="accent">Месяц {plan.month}</Badge>
              <Badge>Неделя {plan.weekOfProgram}</Badge>
              {plan.isDeload && <Badge variant="purple">Разгрузка</Badge>}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight">{plan.title}</h1>
          <p className="text-sm text-white/50">{plan.focus}</p>
          <p className="mt-1 text-xs capitalize text-white/40">
            {weekdayFromNumber(plan.dayOfWeek)}, {formatDateFull(date)} · ~{plan.estMinutes} мин
          </p>
        </div>
      </FadeIn>

      {isCompleted && (
        <FadeIn>
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 size={18} /> Тренировка выполнена
            <Link href={`/workout/${session!.id}`} className="ml-auto flex items-center">
              Детали <ChevronRight size={16} />
            </Link>
          </div>
        </FadeIn>
      )}

      {/* Заметка / прогрессия */}
      <FadeIn delay={0.05}>
        <Card className="mb-4">
          <div className="flex gap-3">
            <Info size={18} className="shrink-0 text-accent-soft" />
            <p className="text-sm leading-relaxed text-white/70">{plan.notes}</p>
          </div>
        </Card>
      </FadeIn>

      {/* Разминка */}
      <SectionBlock icon={<Flame size={16} />} title="Разминка" color="text-amber-300">
        {warmup.map((w) => (
          <p key={w.id} className="text-sm text-white/70">
            {w.exercise.name} · {w.reps}
            {w.note && <span className="block text-xs text-white/40">{w.note}</span>}
          </p>
        ))}
      </SectionBlock>

      {/* Силовая часть */}
      <div className="mb-2 mt-6 flex items-center gap-2">
        <Dumbbell size={16} className="text-accent-soft" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">
          Силовая часть
        </h2>
      </div>
      <div className="space-y-2">
        {strength.map((it, i) => (
          <Link
            key={it.id}
            href={`/exercises/${it.exercise.slug}`}
            className="glass block p-4 transition-all active:scale-[0.98]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs font-bold text-white/50">
                  {i + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{it.exercise.name}</span>
                    {BLOCK_LABEL[it.block] && (
                      <Badge variant={it.block === "finisher" ? "red" : "purple"}>
                        {BLOCK_LABEL[it.block]}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-white/45">
                    {it.exercise.muscleGroup} · {it.exercise.equipment}
                  </div>
                </div>
              </div>
              <ChevronRight size={16} className="mt-1 shrink-0 text-white/25" />
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
              <Metric icon={<Repeat size={13} />} label={`${it.sets} × ${it.reps}`} />
              <Metric icon={<Weight size={13} />} label={it.weightAdvice} />
              {it.restSeconds > 0 && (
                <Metric icon={<Timer size={13} />} label={`отдых ${formatClock(it.restSeconds)}`} />
              )}
            </div>
            {it.note && <p className="mt-2 text-xs text-white/40">{it.note}</p>}
          </Link>
        ))}
      </div>

      {/* Кардио */}
      <SectionBlock icon={<HeartPulse size={16} />} title="Кардио" color="text-rose-300">
        {cardio.map((c) => (
          <p key={c.id} className="text-sm text-white/70">
            {c.exercise.name}
            {c.note && <span className="block text-xs text-white/40">{c.note}</span>}
          </p>
        ))}
      </SectionBlock>

      {/* Заминка */}
      <SectionBlock icon={<Snowflake size={16} />} title="Заминка" color="text-sky-300">
        {cooldown.map((c) => (
          <p key={c.id} className="text-sm text-white/70">
            {c.exercise.name} · {c.reps}
            {c.note && <span className="block text-xs text-white/40">{c.note}</span>}
          </p>
        ))}
      </SectionBlock>

      {/* Отдых */}
      <Card className="mt-4">
        <p className="text-xs leading-relaxed text-white/50">
          <span className="font-semibold text-white/70">Восстановление: </span>
          {plan.restAdvice}
        </p>
      </Card>

      {/* Действие */}
      <div className="sticky bottom-[calc(var(--nav-height)+var(--safe-bottom))] mt-6">
        {inProgress ? (
          <Link href={`/workout/${session!.id}`} className="btn-primary w-full">
            Продолжить тренировку
          </Link>
        ) : (
          <StartWorkoutButton
            planId={plan.id}
            label={isCompleted ? "Повторить тренировку" : "Начать тренировку"}
            className="w-full"
          />
        )}
      </div>
      <div className="h-4" />
    </div>
  );
}

function SectionBlock({
  icon,
  title,
  color,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center gap-2">
        <span className={color}>{icon}</span>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">
          {title}
        </h2>
      </div>
      <Card className="space-y-1">{children}</Card>
    </div>
  );
}

function Metric({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-white/60">
      <span className="text-white/35">{icon}</span>
      {label}
    </span>
  );
}
