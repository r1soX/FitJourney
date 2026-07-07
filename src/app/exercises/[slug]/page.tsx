import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, Target, Wrench, Lightbulb, ListChecks, RefreshCw } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FadeIn } from "@/components/ui/Motion";
import { FavoriteToggle } from "@/components/FavoriteToggle";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  warmup: "Разминка",
  strength: "Силовое",
  core: "Кор",
  cardio: "Кардио",
  cooldown: "Заминка",
};

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const ex = await prisma.exercise.findUnique({ where: { slug } });
  if (!ex) notFound();

  const favorite = await prisma.favorite.findUnique({
    where: { userId_exerciseSlug: { userId: session.uid, exerciseSlug: slug } },
  });
  const isFavorite = !!favorite;

  let altSlugs: string[] = [];
  try {
    altSlugs = JSON.parse(ex.alternativeSlugs) as string[];
  } catch {
    altSlugs = [];
  }
  const alternatives = altSlugs.length
    ? await prisma.exercise.findMany({
        where: { slug: { in: altSlugs } },
        select: { slug: true, name: true, muscleGroup: true },
      })
    : [];

  return (
    <div>
      <FadeIn>
        <div className="mb-4 mt-2 flex items-center gap-2">
          <Link href="/exercises" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex-1" />
          <FavoriteToggle slug={ex.slug} initial={isFavorite} />
        </div>

        <div className="mb-4">
          <div className="mb-2 flex flex-wrap gap-2">
            <Badge variant="accent">{CATEGORY_LABEL[ex.category] ?? ex.category}</Badge>
            <Badge>{ex.muscleGroup}</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{ex.name}</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/60">{ex.description}</p>
        </div>
      </FadeIn>

      <FadeIn delay={0.05}>
        <div className="mb-4 grid grid-cols-2 gap-3">
          <Card className="!p-4">
            <div className="mb-1 flex items-center gap-2 text-white/40">
              <Target size={14} /> <span className="text-xs uppercase tracking-wide">Мышцы</span>
            </div>
            <div className="font-medium capitalize">{ex.muscleGroup}</div>
          </Card>
          <Card className="!p-4">
            <div className="mb-1 flex items-center gap-2 text-white/40">
              <Wrench size={14} /> <span className="text-xs uppercase tracking-wide">Оборуд.</span>
            </div>
            <div className="font-medium">{ex.equipment}</div>
          </Card>
        </div>
      </FadeIn>

      <FadeIn delay={0.08}>
        <div className="mb-2 flex items-center gap-2">
          <ListChecks size={16} className="text-accent-soft" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">Техника</h2>
        </div>
        <Card>
          <p className="text-sm leading-relaxed text-white/75">{ex.technique}</p>
        </Card>
      </FadeIn>

      {ex.tips && (
        <FadeIn delay={0.1}>
          <div className="mt-4">
            <Card className="border-accent/20 bg-accent/5">
              <div className="flex gap-3">
                <Lightbulb size={18} className="shrink-0 text-accent-soft" />
                <p className="text-sm leading-relaxed text-white/75">{ex.tips}</p>
              </div>
            </Card>
          </div>
        </FadeIn>
      )}

      {alternatives.length > 0 && (
        <FadeIn delay={0.12}>
          <div className="mt-6">
            <div className="mb-2 flex items-center gap-2">
              <RefreshCw size={16} className="text-accent-soft" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">
                Чем заменить
              </h2>
            </div>
            <div className="space-y-2">
              {alternatives.map((a) => (
                <Link
                  key={a.slug}
                  href={`/exercises/${a.slug}`}
                  className="glass flex items-center justify-between p-3.5 active:scale-[0.98]"
                >
                  <div>
                    <div className="font-medium">{a.name}</div>
                    <div className="text-xs capitalize text-white/40">{a.muscleGroup}</div>
                  </div>
                  <ChevronRight size={16} className="text-white/25" />
                </Link>
              ))}
            </div>
          </div>
        </FadeIn>
      )}
      <div className="h-4" />
    </div>
  );
}
