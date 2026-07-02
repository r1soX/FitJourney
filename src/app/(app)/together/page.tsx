import { redirect } from "next/navigation";
import {
  Users,
  TrendingDown,
  Dumbbell,
  Clock,
  Flame,
  Target,
  Crown,
  Handshake,
} from "lucide-react";
import { getUser, getComparisonData, type PersonSummary } from "@/lib/data";
import { unitLabel, toDisplayWeight, pluralize } from "@/lib/format";
import { PageHeader, SectionTitle } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/Motion";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TogetherPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  const data = await getComparisonData();
  if (!data) return null;
  const ul = unitLabel(user.unit);

  if (!data.hasPartner) {
    return (
      <div>
        <FadeIn>
          <PageHeader title="Вместе" subtitle="Тренировки с другом" />
        </FadeIn>
        <FadeIn delay={0.05}>
          <Card className="text-center">
            <Users className="mx-auto mb-2 text-white/30" />
            <p className="text-sm text-white/50">
              Второй аккаунт не найден. Добавь друга, чтобы видеть общий прогресс.
            </p>
          </Card>
        </FadeIn>
      </div>
    );
  }

  const [me, partner] = data.people;

  // Лидер по метрикам (для дружеского сравнения)
  const leader = (a: number, b: number): "me" | "partner" | "tie" =>
    a > b ? "me" : b > a ? "partner" : "tie";

  const rows: {
    label: string;
    icon: React.ReactNode;
    meVal: number;
    partnerVal: number;
    fmt: (v: number) => string;
    higherBetter: boolean;
  }[] = [
    {
      label: "% к цели",
      icon: <Target size={14} />,
      meVal: me.weightProgress,
      partnerVal: partner.weightProgress,
      fmt: (v) => `${Math.round(v)}%`,
      higherBetter: true,
    },
    {
      label: "Сброшено",
      icon: <TrendingDown size={14} />,
      meVal: me.lost,
      partnerVal: partner.lost,
      fmt: (v) => `−${toDisplayWeight(v, user.unit).toFixed(1)}`,
      higherBetter: true,
    },
    {
      label: "Тренировок",
      icon: <Dumbbell size={14} />,
      meVal: me.completed,
      partnerVal: partner.completed,
      fmt: (v) => `${v}`,
      higherBetter: true,
    },
    {
      label: "Серия",
      icon: <Flame size={14} />,
      meVal: me.currentStreak,
      partnerVal: partner.currentStreak,
      fmt: (v) => `${v}`,
      higherBetter: true,
    },
  ];

  return (
    <div>
      <FadeIn>
        <PageHeader title="Вместе" subtitle="Вы с другом в одном ритме" />
      </FadeIn>

      {/* Общий итог */}
      <SectionTitle>Общий итог вдвоём</SectionTitle>
      <Stagger className="grid grid-cols-2 gap-3">
        <StaggerItem>
          <StatTile
            label="Сброшено вместе"
            value={`−${toDisplayWeight(data.combined.lost, user.unit).toFixed(1)}`}
            sub={ul}
            icon={<TrendingDown size={16} />}
            accent
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            label="Тренировок вместе"
            value={data.combined.completed}
            sub="выполнено суммарно"
            icon={<Dumbbell size={16} />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            label="Часов в зале"
            value={data.combined.totalHours.toFixed(1)}
            sub="вдвоём"
            icon={<Clock size={16} />}
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            label="В один день"
            value={data.combined.workoutsTogether}
            sub={pluralize(data.combined.workoutsTogether, "раз тренировались", "раза тренировались", "раз тренировались")}
            icon={<Handshake size={16} />}
            accent
          />
        </StaggerItem>
      </Stagger>

      {/* Голова к голове */}
      <SectionTitle>Голова к голове</SectionTitle>
      <FadeIn delay={0.05}>
        <Card strong className="!p-4">
          {/* Имена */}
          <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <PersonHead person={me} />
            <span className="text-xs font-bold uppercase text-white/30">vs</span>
            <PersonHead person={partner} align="right" />
          </div>

          <div className="space-y-2.5">
            {rows.map((r) => {
              const win = r.higherBetter
                ? leader(r.meVal, r.partnerVal)
                : leader(r.partnerVal, r.meVal);
              return (
                <div key={r.label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <div
                    className={cn(
                      "flex items-center justify-end gap-1.5 rounded-xl px-2 py-2 text-right text-sm font-bold tabular",
                      win === "me" ? "bg-accent/15 text-accent-soft" : "text-white/70",
                    )}
                  >
                    {win === "me" && <Crown size={13} className="text-amber-400" />}
                    {r.fmt(r.meVal)}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] uppercase text-white/35">
                    {r.icon}
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl px-2 py-2 text-sm font-bold tabular",
                      win === "partner" ? "bg-accent/15 text-accent-soft" : "text-white/70",
                    )}
                  >
                    {r.fmt(r.partnerVal)}
                    {win === "partner" && <Crown size={13} className="text-amber-400" />}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-center text-[10px] uppercase tracking-wider text-white/30">
            {rows.map((r) => r.label).join(" · ")}
          </div>
        </Card>
      </FadeIn>

      {/* Индивидуальный прогресс */}
      <SectionTitle>Прогресс каждого</SectionTitle>
      <div className="space-y-3">
        {data.people.map((p) => (
          <FadeIn key={p.id} delay={0.05}>
            <Card>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{p.isCurrent ? `${p.name} (ты)` : p.name}</span>
                  {p.onTrackDelta >= 0.3 ? (
                    <Badge variant="green">впереди плана</Badge>
                  ) : p.onTrackDelta <= -0.3 ? (
                    <Badge variant="yellow">отстаёт</Badge>
                  ) : (
                    <Badge variant="accent">по плану</Badge>
                  )}
                </div>
                <span className="text-sm font-bold tabular">
                  {toDisplayWeight(p.currentWeight, user.unit).toFixed(1)} {ul}
                </span>
              </div>
              <ProgressBar progress={p.weightProgress} height={10} />
              <div className="mt-2 flex justify-between text-xs text-white/45">
                <span>Старт {toDisplayWeight(p.startWeight, user.unit).toFixed(0)}</span>
                <span className="text-accent-soft">{Math.round(p.weightProgress)}% · −{toDisplayWeight(p.lost, user.unit).toFixed(1)} {ul}</span>
                <span>Цель {toDisplayWeight(p.goalWeight, user.unit).toFixed(0)}</span>
              </div>
            </Card>
          </FadeIn>
        ))}
      </div>

      <p className="mt-5 px-1 text-center text-xs text-white/30">
        Соревнуйтесь по-доброму — вместе идти к цели проще 💪
      </p>
      <div className="h-4" />
    </div>
  );
}

function PersonHead({ person, align }: { person: PersonSummary; align?: "right" }) {
  const initial = person.name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className={cn("flex items-center gap-2", align === "right" && "flex-row-reverse text-right")}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-soft to-accent-deep text-base font-bold text-white">
        {initial}
      </div>
      <div className={cn("min-w-0", align === "right" && "text-right")}>
        <div className="truncate text-sm font-semibold">
          {person.isCurrent ? "Ты" : person.name}
        </div>
        <div className="truncate text-[10px] text-white/40">@{person.username}</div>
      </div>
    </div>
  );
}
