import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { FadeIn } from "@/components/ui/Motion";
import { ExercisesBrowser, type ExerciseLite } from "@/components/ExercisesBrowser";

export const dynamic = "force-dynamic";

export default async function ExercisesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [exercises, favorites] = await Promise.all([
    prisma.exercise.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.favorite.findMany({ where: { userId: session.uid }, select: { exerciseSlug: true } }),
  ]);
  const favSet = new Set(favorites.map((f) => f.exerciseSlug));
  const lite: ExerciseLite[] = exercises.map((e) => ({
    slug: e.slug,
    name: e.name,
    muscleGroup: e.muscleGroup,
    equipment: e.equipment,
    category: e.category,
    isFavorite: favSet.has(e.slug),
  }));

  return (
    <div>
      <FadeIn>
        <PageHeader title="Упражнения" subtitle={`${exercises.length} в библиотеке`} />
      </FadeIn>
      <ExercisesBrowser exercises={lite} />
      <div className="h-4" />
    </div>
  );
}
