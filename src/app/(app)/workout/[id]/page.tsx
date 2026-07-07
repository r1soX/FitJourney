import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { WorkoutRunner, type RunnerLog, type RunnerData } from "@/components/workout/WorkoutRunner";

export const dynamic = "force-dynamic";

interface SetData {
  reps: string;
  weight: string;
  done: boolean;
}

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const workout = await prisma.workoutSession.findUnique({
    where: { id: Number(id) },
    include: {
      exerciseLogs: { orderBy: { order: "asc" } },
      plan: true,
    },
  });
  if (!workout || !workout.plan) notFound();
  if (workout.userId !== session.uid) notFound();

  // Собираем детали упражнений и их аналоги
  const logSlugs = workout.exerciseLogs.map((l) => l.exerciseSlug);
  const baseExercises = await prisma.exercise.findMany({
    where: { slug: { in: logSlugs } },
  });
  const bySlug = new Map(baseExercises.map((e) => [e.slug, e]));

  // Собираем все возможные slug-аналоги, чтобы получить их названия
  const altSlugs = new Set<string>();
  for (const e of baseExercises) {
    try {
      (JSON.parse(e.alternativeSlugs) as string[]).forEach((s) => altSlugs.add(s));
    } catch {
      /* ignore */
    }
  }
  const altExercises = await prisma.exercise.findMany({
    where: { slug: { in: [...altSlugs] } },
    select: { slug: true, name: true },
  });
  const altNameBySlug = new Map(altExercises.map((e) => [e.slug, e.name]));

  const logs: RunnerLog[] = workout.exerciseLogs.map((l) => {
    const ex = bySlug.get(l.exerciseSlug);
    let sets: SetData[] = [];
    try {
      sets = JSON.parse(l.setsData) as SetData[];
    } catch {
      sets = [];
    }
    let alternatives: { slug: string; name: string }[] = [];
    if (ex) {
      try {
        alternatives = (JSON.parse(ex.alternativeSlugs) as string[])
          .map((s) => ({ slug: s, name: altNameBySlug.get(s) ?? s }))
          .filter((a) => a.name !== a.slug);
      } catch {
        alternatives = [];
      }
    }
    return {
      id: l.id,
      order: l.order,
      block: "main", // уточняется ниже из плана
      exerciseSlug: l.exerciseSlug,
      exerciseName: l.exerciseName,
      targetSets: l.targetSets,
      targetReps: l.targetReps,
      targetWeight: l.targetWeight,
      restSeconds: l.restSeconds,
      status: l.status,
      note: "",
      technique: ex?.technique ?? "",
      tips: ex?.tips ?? "",
      muscleGroup: ex?.muscleGroup ?? "",
      equipment: ex?.equipment ?? "",
      sets,
      alternatives,
    };
  });

  // Дополняем block и note из плана (сопоставление по order)
  const planItems = await prisma.workoutExercise.findMany({
    where: { planId: workout.planId! },
    orderBy: { order: "asc" },
  });
  const planByOrder = new Map(planItems.map((p) => [p.order, p]));
  for (const log of logs) {
    const p = planByOrder.get(log.order);
    if (p) {
      log.block = p.block;
      log.note = p.note;
    } else {
      log.block = "main";
    }
  }

  const data: RunnerData = {
    sessionId: workout.id,
    planTitle: workout.plan.title,
    planFocus: workout.plan.focus,
    planSequence: workout.plan.sequence,
    status: workout.status,
    startedAtISO: workout.startedAt ? workout.startedAt.toISOString() : null,
    durationSec: workout.durationSec ?? null,
    logs,
  };

  return <WorkoutRunner data={data} />;
}
