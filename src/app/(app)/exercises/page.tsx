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

  const exercises = await prisma.exercise.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  const lite: ExerciseLite[] = exercises.map((e) => ({
    slug: e.slug,
    name: e.name,
    muscleGroup: e.muscleGroup,
    equipment: e.equipment,
    category: e.category,
    isFavorite: e.isFavorite,
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
