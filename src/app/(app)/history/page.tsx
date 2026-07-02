import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, XCircle, Clock, ChevronRight, Dumbbell, Frown } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/data";
import { formatDateFull, formatDuration } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FadeIn } from "@/components/ui/Motion";

export const dynamic = "force-dynamic";

const MOOD = ["😞", "😕", "😐", "🙂", "😄"];

export default async function HistoryPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const sessions = await prisma.workoutSession.findMany({
    where: { status: { in: ["completed", "skipped"] } },
    orderBy: { date: "desc" },
    include: {
      plan: { select: { title: true, sequence: true, month: true } },
      _count: { select: { exerciseLogs: true } },
    },
  });

  return (
    <div>
      <FadeIn>
        <PageHeader title="История" subtitle={`${sessions.length} записей`} />
      </FadeIn>

      {sessions.length === 0 ? (
        <FadeIn delay={0.05}>
          <Card className="text-center">
            <Dumbbell className="mx-auto mb-2 text-white/30" />
            <p className="text-sm text-white/50">
              Пока нет завершённых тренировок. Начни первую — и она появится здесь.
            </p>
          </Card>
        </FadeIn>
      ) : (
        <div className="space-y-2">
          {sessions.map((s, i) => {
            const completed = s.status === "completed";
            return (
              <FadeIn key={s.id} delay={Math.min(i * 0.03, 0.3)}>
                <Link
                  href={completed ? `/workout/${s.id}` : `/program/${s.plan?.sequence ?? ""}`}
                  className="glass flex items-center gap-3 p-4 active:scale-[0.98]"
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                      completed ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                    }`}
                  >
                    {completed ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold">
                        {s.plan?.title ?? "Тренировка"}
                      </span>
                      {s.mood != null && <span>{MOOD[s.mood - 1]}</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-white/45">
                      <span>{formatDateFull(s.date)}</span>
                      {completed && s.durationSec ? (
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {formatDuration(s.durationSec)}
                        </span>
                      ) : null}
                      {completed && (
                        <span>{s._count.exerciseLogs} упр.</span>
                      )}
                    </div>
                    {s.notes && (
                      <p className="mt-1 line-clamp-1 text-xs text-white/40">{s.notes}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {completed ? (
                      s.difficulty != null && (
                        <Badge variant={s.difficulty >= 4 ? "red" : s.difficulty <= 2 ? "green" : "default"}>
                          сложн. {s.difficulty}/5
                        </Badge>
                      )
                    ) : (
                      <Badge variant="yellow">
                        <Frown size={11} /> пропуск
                      </Badge>
                    )}
                    <ChevronRight size={16} className="text-white/25" />
                  </div>
                </Link>
              </FadeIn>
            );
          })}
        </div>
      )}
      <div className="h-4" />
    </div>
  );
}
