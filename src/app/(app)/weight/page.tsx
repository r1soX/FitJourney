import { redirect } from "next/navigation";
import { addDays, differenceInCalendarDays } from "date-fns";
import { Scale, Trophy, TrendingDown, CalendarCheck, Gauge } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/data";
import { targetWeightForDate, forecastGoalDate } from "@/lib/program/weightPlan";
import { formatDateShort, formatDateFull, unitLabel, toDisplayWeight } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { FadeIn } from "@/components/ui/Motion";
import { WeightManager, type WeightPoint, type WeightRow } from "@/components/weight/WeightManager";

export const dynamic = "force-dynamic";

export default async function WeightPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const unit = user.unit;
  const ul = unitLabel(unit);

  const entries = await prisma.weightEntry.findMany({ orderBy: { date: "asc" } });

  // Строки истории с дельтой
  const rows: WeightRow[] = entries.map((e, i) => ({
    id: e.id,
    dateLabel: formatDateFull(e.date),
    dateISO: e.date.toISOString(),
    weight: toDisplayWeight(e.weight, unit),
    delta: i > 0 ? toDisplayWeight(e.weight - entries[i - 1].weight, unit) : null,
    note: e.note,
  }));

  // Точки графика: объединяем даты замеров и ежемесячные плановые точки
  const start = user.programStartDate;
  const keyed = new Map<string, { date: Date; actual: number | null; target: number }>();
  const put = (date: Date, actual: number | null) => {
    const key = date.toISOString().slice(0, 10);
    const target = toDisplayWeight(targetWeightForDate(start, date), unit);
    const existing = keyed.get(key);
    if (existing) {
      if (actual !== null) existing.actual = actual;
    } else {
      keyed.set(key, { date, actual, target });
    }
  };
  for (let m = 0; m <= 12; m++) put(addDays(start, Math.round(m * 30.44)), null);
  for (const e of entries) put(e.date, toDisplayWeight(e.weight, unit));

  const points: WeightPoint[] = [...keyed.values()]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((p) => ({
      dateLabel: formatDateShort(p.date),
      actual: p.actual,
      target: Math.round(p.target * 10) / 10,
    }));

  // Сводка
  const currentKg = entries.length ? entries[entries.length - 1].weight : user.currentWeight;
  const bestKg = entries.length ? Math.min(...entries.map((e) => e.weight)) : user.currentWeight;
  const lostKg = Math.max(0, user.startWeight - currentKg);

  let avgWeeklyKg = 0;
  if (entries.length >= 2) {
    const first = entries[0];
    const last = entries[entries.length - 1];
    const weeks = Math.max(1, differenceInCalendarDays(last.date, first.date) / 7);
    avgWeeklyKg = (first.weight - last.weight) / weeks;
  }
  const forecast = forecastGoalDate(currentKg, avgWeeklyKg > 0.05 ? avgWeeklyKg : 0.9);

  return (
    <div>
      <FadeIn>
        <PageHeader title="Вес" subtitle={`Старт ${user.startWeight} → цель ${user.goalWeight} ${ul}`} />
      </FadeIn>

      <FadeIn delay={0.05}>
        <div className="mb-4 grid grid-cols-2 gap-3">
          <StatTile
            label="Текущий"
            value={`${toDisplayWeight(currentKg, unit).toFixed(1)}`}
            sub={ul}
            icon={<Scale size={16} />}
            accent
          />
          <StatTile
            label="Лучший результат"
            value={`${toDisplayWeight(bestKg, unit).toFixed(1)}`}
            sub={ul}
            icon={<Trophy size={16} />}
          />
          <StatTile
            label="Сброшено"
            value={`−${toDisplayWeight(lostKg, unit).toFixed(1)}`}
            sub={ul}
            icon={<TrendingDown size={16} />}
          />
          <StatTile
            label="Темп/нед"
            value={avgWeeklyKg > 0 ? `−${toDisplayWeight(avgWeeklyKg, unit).toFixed(2)}` : "—"}
            sub={ul}
            icon={<Gauge size={16} />}
          />
        </div>
      </FadeIn>

      {forecast && (
        <FadeIn delay={0.08}>
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3">
            <CalendarCheck size={20} className="text-accent-soft" />
            <div className="text-sm">
              <span className="text-white/60">Прогноз достижения цели: </span>
              <span className="font-semibold text-accent-soft">{formatDateFull(forecast)}</span>
            </div>
          </div>
        </FadeIn>
      )}

      <FadeIn delay={0.1}>
        <WeightManager points={points} rows={rows} goalWeight={toDisplayWeight(user.goalWeight, unit)} unitLabel={ul} />
      </FadeIn>
      <div className="h-4" />
    </div>
  );
}
