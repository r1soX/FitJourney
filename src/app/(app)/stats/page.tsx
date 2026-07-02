import { redirect } from "next/navigation";
import {
  CheckCircle2,
  Percent,
  TrendingDown,
  Gauge,
  Flame,
  Clock,
  Timer,
  Dumbbell,
  CalendarCheck,
  Award,
} from "lucide-react";
import { getUser, getFullStats } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { formatDuration, formatDateFull, unitLabel, toDisplayWeight, pluralize } from "@/lib/format";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { Card } from "@/components/ui/Card";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/Motion";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const stats = await getFullStats();
  if (!stats) return null;
  const ul = unitLabel(user.unit);

  const achievements = await prisma.achievement.findMany({ where: { userId: user.id } });
  const unlocked = achievements.filter((a) => a.unlockedAt).length;

  return (
    <div>
      <FadeIn>
        <PageHeader title="Статистика" subtitle="Твой прогресс в цифрах" />
      </FadeIn>

      {/* Общий прогресс */}
      <FadeIn delay={0.05}>
        <Card strong className="flex items-center gap-5">
          <ProgressRing progress={(stats.completed / stats.totalWorkouts) * 100} size={110} stroke={10}>
            <span className="text-2xl font-bold tabular">{stats.completed}</span>
            <span className="text-[10px] uppercase text-white/40">из {stats.totalWorkouts}</span>
          </ProgressRing>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider text-white/40">Общий прогресс</div>
            <div className="mt-1 text-3xl font-bold tabular">
              {Math.round((stats.completed / stats.totalWorkouts) * 100)}%
            </div>
            <p className="mt-1 text-sm text-white/50">годовой программы пройдено</p>
          </div>
        </Card>
      </FadeIn>

      <SectionTitle>Тренировки</SectionTitle>
      <Stagger className="grid grid-cols-2 gap-3">
        <StaggerItem>
          <StatTile label="Выполнено" value={stats.completed} icon={<CheckCircle2 size={16} />} accent />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            label="Процент выполнения"
            value={`${Math.round(stats.completionRate)}%`}
            sub="от начатых"
            icon={<Percent size={16} />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            label="Часов в зале"
            value={stats.totalHours.toFixed(1)}
            sub="суммарно"
            icon={<Clock size={16} />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            label="Средняя тренировка"
            value={stats.avgSessionSeconds ? formatDuration(stats.avgSessionSeconds) : "—"}
            icon={<Timer size={16} />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            label="Текущая серия"
            value={stats.currentStreak}
            sub={pluralize(stats.currentStreak, "тренировка", "тренировки", "тренировок")}
            icon={<Flame size={16} />}
            accent
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            label="Лучшая серия"
            value={stats.longestStreak}
            sub="без пропусков"
            icon={<Award size={16} />}
          />
        </StaggerItem>
      </Stagger>

      <SectionTitle>Похудение</SectionTitle>
      <Stagger className="grid grid-cols-2 gap-3">
        <StaggerItem>
          <StatTile
            label="Сброшено веса"
            value={`−${toDisplayWeight(stats.weightLost, user.unit).toFixed(1)}`}
            sub={ul}
            icon={<TrendingDown size={16} />}
            accent
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            label="Средний темп"
            value={stats.avgWeeklyRate > 0 ? `−${toDisplayWeight(stats.avgWeeklyRate, user.unit).toFixed(2)}` : "—"}
            sub={`${ul}/нед`}
            icon={<Gauge size={16} />}
          />
        </StaggerItem>
      </Stagger>

      {stats.forecastDate && (
        <FadeIn delay={0.1}>
          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3">
            <CalendarCheck size={20} className="text-accent-soft" />
            <div className="text-sm">
              <span className="text-white/60">Цель {user.goalWeight} {ul} ожидается: </span>
              <span className="font-semibold text-accent-soft">{formatDateFull(stats.forecastDate)}</span>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Достижения */}
      <SectionTitle action={<Link href="/achievements" className="text-xs text-accent-soft">все</Link>}>
        Достижения
      </SectionTitle>
      <FadeIn delay={0.1}>
        <Link href="/achievements" className="glass flex items-center gap-4 p-4 active:scale-[0.98]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600">
            <Award size={26} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-bold">
              {unlocked} <span className="text-sm font-normal text-white/40">из {achievements.length}</span>
            </div>
            <div className="text-sm text-white/50">получено наград</div>
          </div>
          <Dumbbell size={18} className="text-white/25" />
        </Link>
      </FadeIn>

      <div className="h-4" />
    </div>
  );
}
