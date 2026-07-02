import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ChevronLeft,
  Play,
  Dumbbell,
  Medal,
  Flame,
  TrendingDown,
  Trophy,
  Clock,
  CalendarCheck,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatDateFull } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FadeIn, Stagger, StaggerItem } from "@/components/ui/Motion";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ICONS: Record<string, LucideIcon> = {
  play: Play,
  dumbbell: Dumbbell,
  medal: Medal,
  flame: Flame,
  "trending-down": TrendingDown,
  trophy: Trophy,
  clock: Clock,
  "calendar-check": CalendarCheck,
};

const TIER_STYLE: Record<string, string> = {
  bronze: "from-amber-600 to-amber-800",
  silver: "from-slate-300 to-slate-500",
  gold: "from-amber-300 to-amber-500",
};

export default async function AchievementsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const achievements = await prisma.achievement.findMany({ orderBy: { id: "asc" } });
  const unlocked = achievements.filter((a) => a.unlockedAt).length;

  return (
    <div>
      <FadeIn>
        <div className="mb-4 mt-2 flex items-center gap-2">
          <Link href="/more" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <ChevronLeft size={20} />
          </Link>
        </div>
        <PageHeader
          title="Достижения"
          subtitle={`${unlocked} из ${achievements.length} получено`}
        />
        <ProgressBar progress={(unlocked / achievements.length) * 100} className="mb-6" height={10} />
      </FadeIn>

      <Stagger className="grid grid-cols-2 gap-3">
        {achievements.map((a) => {
          const Icon = ICONS[a.icon] ?? Trophy;
          const isUnlocked = !!a.unlockedAt;
          return (
            <StaggerItem key={a.id}>
              <div
                className={cn(
                  "glass flex h-full flex-col items-center p-4 text-center",
                  !isUnlocked && "opacity-50",
                )}
              >
                <div
                  className={cn(
                    "mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br",
                    isUnlocked ? TIER_STYLE[a.tier] : "from-white/5 to-white/5",
                  )}
                >
                  {isUnlocked ? (
                    <Icon size={26} className="text-white" />
                  ) : (
                    <Lock size={22} className="text-white/40" />
                  )}
                </div>
                <div className="text-sm font-semibold">{a.title}</div>
                <div className="mt-0.5 text-xs leading-snug text-white/45">{a.description}</div>
                {isUnlocked && a.unlockedAt && (
                  <div className="mt-2 text-[10px] text-emerald-400">
                    {formatDateFull(a.unlockedAt)}
                  </div>
                )}
              </div>
            </StaggerItem>
          );
        })}
      </Stagger>
      <div className="h-4" />
    </div>
  );
}
