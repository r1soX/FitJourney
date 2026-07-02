import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, TrendingDown, Info, AlertTriangle, Zap } from "lucide-react";
import { getUser } from "@/lib/data";
import { PHASE_INFO } from "@/lib/program/generator";
import {
  monthlyMilestones,
  SAFE_WEEKLY_RATE,
  PLATEAU_ADVICE,
  FAST_LOSS_ADVICE,
} from "@/lib/program/weightPlan";
import { unitLabel, toDisplayWeight } from "@/lib/format";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FadeIn } from "@/components/ui/Motion";

export const dynamic = "force-dynamic";

export default async function PlanInfoPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const ul = unitLabel(user.unit);
  const milestones = monthlyMilestones();

  return (
    <div>
      <FadeIn>
        <div className="mb-4 mt-2 flex items-center gap-2">
          <Link href="/more" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <ChevronLeft size={20} />
          </Link>
        </div>
        <PageHeader title="О программе" subtitle="Как устроен твой год" />
      </FadeIn>

      <FadeIn delay={0.05}>
        <Card className="mb-2">
          <div className="flex gap-3">
            <Info size={18} className="shrink-0 text-accent-soft" />
            <p className="text-sm leading-relaxed text-white/70">
              Программа рассчитана на 12 месяцев: 3 тренировки в неделю (Пн/Ср/Пт) с плавным
              ростом нагрузки. Каждая 4-я неделя — разгрузочная для восстановления.
              Безопасный темп похудения — {SAFE_WEEKLY_RATE.min}–{SAFE_WEEKLY_RATE.max} {ul} в неделю.
            </p>
          </div>
        </Card>
      </FadeIn>

      <SectionTitle>Фазы программы</SectionTitle>
      <div className="space-y-2">
        {PHASE_INFO.map((p, i) => (
          <FadeIn key={p.name} delay={Math.min(i * 0.04, 0.25)}>
            <Card>
              <div className="flex items-center gap-2">
                <Badge variant="accent">Мес. {p.months[0]}–{p.months[1]}</Badge>
                <span className="font-semibold">{p.name}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{p.intro}</p>
            </Card>
          </FadeIn>
        ))}
      </div>

      <SectionTitle>Контрольные точки веса</SectionTitle>
      <FadeIn delay={0.1}>
        <Card className="!p-3">
          <div className="grid grid-cols-3 gap-2">
            {milestones.map((m) => (
              <div key={m.month} className="rounded-2xl border border-white/5 bg-white/[0.03] p-3 text-center">
                <div className="text-[10px] uppercase tracking-wide text-white/40">Мес {m.month}</div>
                <div className="mt-1 text-lg font-bold tabular text-accent-soft">
                  {toDisplayWeight(m.targetWeight, user.unit).toFixed(0)}
                </div>
                <div className="text-[10px] text-emerald-400">−{toDisplayWeight(m.lostByThen, user.unit).toFixed(0)} {ul}</div>
              </div>
            ))}
          </div>
        </Card>
      </FadeIn>

      <SectionTitle>Если наступило плато</SectionTitle>
      <FadeIn delay={0.12}>
        <Card className="border-amber-500/20 bg-amber-500/[0.04]">
          <div className="mb-2 flex items-center gap-2 text-amber-300">
            <AlertTriangle size={16} />
            <span className="text-sm font-semibold">Вес встал — что делать</span>
          </div>
          <ul className="space-y-2">
            {PLATEAU_ADVICE.map((t, i) => (
              <li key={i} className="flex gap-2 text-sm text-white/65">
                <span className="text-amber-400">•</span> {t}
              </li>
            ))}
          </ul>
        </Card>
      </FadeIn>

      <SectionTitle>Если худеешь слишком быстро</SectionTitle>
      <FadeIn delay={0.14}>
        <Card className="border-rose-500/20 bg-rose-500/[0.04]">
          <div className="mb-2 flex items-center gap-2 text-rose-300">
            <Zap size={16} />
            <span className="text-sm font-semibold">Быстрое похудение</span>
          </div>
          <ul className="space-y-2">
            {FAST_LOSS_ADVICE.map((t, i) => (
              <li key={i} className="flex gap-2 text-sm text-white/65">
                <span className="text-rose-400">•</span> {t}
              </li>
            ))}
          </ul>
        </Card>
      </FadeIn>

      <p className="mt-6 flex items-start gap-2 px-1 text-xs text-white/30">
        <TrendingDown size={14} className="mt-0.5 shrink-0" />
        Фактические сроки зависят от индивидуальных особенностей, здоровья и режима питания.
        При проблемах со здоровьем проконсультируйся с врачом.
      </p>
      <div className="h-4" />
    </div>
  );
}
