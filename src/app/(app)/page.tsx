import Link from "next/link";
import {
  Flame,
  CheckCircle2,
  XCircle,
  CalendarClock,
  TrendingDown,
  Target,
  Quote,
  ChevronRight,
  Sparkles,
  Users,
} from "lucide-react";
import { getDashboardData } from "@/lib/data";
import { quoteOfDay } from "@/lib/quotes";
import { formatWeight, weekdayFull, formatDate, relativeDay, pluralize } from "@/lib/format";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { StatTile } from "@/components/ui/StatTile";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SectionTitle } from "@/components/ui/PageHeader";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/Motion";
import { StartWorkoutButton } from "@/components/StartWorkoutButton";

export const dynamic = "force-dynamic";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Доброй ночи";
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Добрый вечер";
}

export default async function HomePage() {
  const data = await getDashboardData();
  if (!data) return null;
  const unit = data.user.unit;
  const quote = quoteOfDay();

  const onTrack = data.onTrackDelta;
  const trackBadge =
    onTrack >= 0.3
      ? { variant: "green" as const, text: `Впереди плана на ${onTrack.toFixed(1)} кг` }
      : onTrack <= -0.3
        ? { variant: "yellow" as const, text: `Отстаёшь на ${Math.abs(onTrack).toFixed(1)} кг` }
        : { variant: "accent" as const, text: "Точно по плану" };

  return (
    <div>
      <FadeIn>
        <header className="mb-6 mt-2">
          <p className="text-sm text-white/50">{greeting()},</p>
          <h1 className="text-2xl font-bold tracking-tight">{data.user.name} 👋</h1>
          <p className="mt-1 text-xs capitalize text-white/40">
            {weekdayFull(new Date())}, {formatDate(new Date())}
          </p>
        </header>
      </FadeIn>

      {/* Главная карточка прогресса */}
      <FadeIn delay={0.05}>
        <Card strong className="overflow-hidden">
          <div className="flex items-center gap-5">
            <ProgressRing progress={data.weightProgress} size={128} stroke={11}>
              <span className="text-3xl font-bold tabular">
                {Math.round(data.weightProgress)}%
              </span>
              <span className="text-[10px] uppercase tracking-wider text-white/40">
                к цели
              </span>
            </ProgressRing>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider text-white/40">
                Текущий вес
              </div>
              <div className="mt-0.5 text-3xl font-bold tabular">
                {formatWeight(data.currentWeight, unit, 1)}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="accent">
                  <Target size={12} /> Цель {formatWeight(data.goalWeight, unit, 0)}
                </Badge>
              </div>
              <div className="mt-2">
                <Badge variant={trackBadge.variant}>{trackBadge.text}</Badge>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-4 text-center">
            <div>
              <div className="text-lg font-bold tabular text-emerald-300">
                −{data.lost.toFixed(1)}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-white/40">
                сброшено
              </div>
            </div>
            <div>
              <div className="text-lg font-bold tabular">
                {(data.currentWeight - data.goalWeight).toFixed(1)}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-white/40">
                осталось
              </div>
            </div>
            <div>
              <div className="text-lg font-bold tabular text-accent-soft">
                {data.toLose.toFixed(0)}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-white/40">
                всего, кг
              </div>
            </div>
          </div>
        </Card>
      </FadeIn>

      {/* Ближайшая тренировка */}
      <SectionTitle>Тренировка</SectionTitle>
      <FadeIn delay={0.1}>
        {data.nextPlan ? (
          <Card strong>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={data.nextPlan.status === "today" ? "green" : "accent"}>
                    <CalendarClock size={12} />
                    {relativeDay(data.nextPlan.date)}
                  </Badge>
                  {data.nextPlan.isDeload && <Badge variant="purple">Разгрузка</Badge>}
                </div>
                <h3 className="mt-2 text-xl font-bold">{data.nextPlan.title}</h3>
                <p className="text-sm text-white/50">{data.nextPlan.focus}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/40">
                  <span>Месяц {data.nextPlan.month}</span>
                  <span>·</span>
                  <span>Неделя {data.nextPlan.weekOfProgram}</span>
                  <span>·</span>
                  <span>~{data.nextPlan.estMinutes} мин</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              {data.nextPlan.status === "today" ? (
                <StartWorkoutButton
                  planId={data.nextPlan.id}
                  label="Начать сегодняшнюю тренировку"
                  className="flex-1"
                />
              ) : (
                <Link
                  href={`/program/${data.nextPlan.sequence}`}
                  className="btn-ghost flex-1"
                >
                  Посмотреть план <ChevronRight size={18} />
                </Link>
              )}
            </div>
          </Card>
        ) : (
          <Card strong className="text-center">
            <Sparkles className="mx-auto mb-2 text-accent-soft" />
            <p className="font-semibold">Программа завершена! 🎉</p>
            <p className="mt-1 text-sm text-white/50">
              Ты прошёл весь годовой план. Пора праздновать результат.
            </p>
          </Card>
        )}
      </FadeIn>

      {/* Статистика */}
      <SectionTitle>Прогресс</SectionTitle>
      <Stagger className="grid grid-cols-2 gap-3">
        <StaggerItem>
          <StatTile
            label="Серия"
            value={data.streak.current}
            sub={`${pluralize(data.streak.current, "тренировка", "тренировки", "тренировок")} подряд`}
            icon={<Flame size={16} />}
            accent
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            label="Выполнено"
            value={data.completed}
            sub={`из ${data.totalWorkouts}`}
            icon={<CheckCircle2 size={16} />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            label="Пропущено"
            value={data.missed}
            sub="тренировок"
            icon={<XCircle size={16} />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            label="Прогресс года"
            value={`${Math.round(data.programProgress)}%`}
            sub={`неделя ${data.currentWeek} · месяц ${data.currentMonth}`}
            icon={<TrendingDown size={16} />}
          />
        </StaggerItem>
      </Stagger>

      {/* Вместе с другом */}
      <FadeIn delay={0.13}>
        <Link
          href="/together"
          className="glass mt-6 flex items-center gap-4 p-4 active:scale-[0.98]"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-soft to-accent-deep">
            <Users size={22} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">Вместе с другом</div>
            <div className="text-xs text-white/45">Общий прогресс и сравнение</div>
          </div>
          <ChevronRight size={18} className="text-white/25" />
        </Link>
      </FadeIn>

      {/* Цитата дня */}
      <FadeIn delay={0.15}>
        <Card className="mt-6">
          <div className="flex gap-3">
            <Quote size={20} className="shrink-0 text-accent-soft" />
            <div>
              <p className="text-sm italic leading-relaxed text-white/80">
                «{quote.text}»
              </p>
              <p className="mt-2 text-xs text-white/40">— {quote.author}</p>
            </div>
          </div>
        </Card>
      </FadeIn>

      <div className="h-4" />
    </div>
  );
}
