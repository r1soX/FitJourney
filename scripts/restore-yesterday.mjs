// Восстанавливает/засчитывает ВЧЕРАШНЮЮ тренировку как выполненную для всех
// пользователей, со случайной длительностью 1:30–1:40.
// Запуск из корня проекта:  node scripts/restore-yesterday.mjs
//
// Идемпотентно: если сессия уже есть — обновит статус и время, не создаст дубль.

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

const yesterday = startOfDay(addDays(new Date(), -1));

const users = await prisma.user.findMany();
const plans = await prisma.workoutPlan.findMany({
  include: { exercises: { orderBy: { order: "asc" }, include: { exercise: true } } },
});

for (const u of users) {
  // план, чья дата по расписанию = вчера
  const plan = plans.find((p) => {
    const d = startOfDay(addDays(u.programStartDate, (p.weekOfProgram - 1) * 7 + (p.dayOfWeek - 1)));
    return d.getTime() === yesterday.getTime();
  });

  if (!plan) {
    console.log(`${u.username}: на вчера тренировки по плану нет — пропускаю`);
    continue;
  }

  // случайная длительность 90–100 минут (1:30–1:40)
  const minutes = 90 + Math.floor(Math.random() * 11);
  const durationSec = minutes * 60;
  const started = new Date(yesterday);
  started.setHours(18, 0, 0, 0);
  const ended = new Date(started.getTime() + durationSec * 1000);

  const existing = await prisma.workoutSession.findUnique({
    where: { userId_planId: { userId: u.id, planId: plan.id } },
  });

  if (existing) {
    await prisma.workoutSession.update({
      where: { id: existing.id },
      data: { status: "completed", date: started, startedAt: started, endedAt: ended, durationSec },
    });
    console.log(`${u.username}: обновлена «${plan.title}» — выполнено, ${minutes} мин (session #${existing.id})`);
  } else {
    const s = await prisma.workoutSession.create({
      data: {
        userId: u.id,
        planId: plan.id,
        date: started,
        status: "completed",
        startedAt: started,
        endedAt: ended,
        durationSec,
        notes: "Восстановлено задним числом",
        exerciseLogs: {
          create: plan.exercises.map((it) => ({
            order: it.order,
            exerciseSlug: it.exercise.slug,
            exerciseName: it.exercise.name,
            targetSets: it.sets,
            targetReps: it.reps,
            targetWeight: it.weightAdvice,
            restSeconds: it.restSeconds,
            status: "completed",
            setsData: JSON.stringify(
              Array.from({ length: it.sets }, () => ({ reps: it.reps, weight: "", done: true })),
            ),
          })),
        },
      },
    });
    console.log(`${u.username}: создана «${plan.title}» — выполнено, ${minutes} мин (session #${s.id})`);
  }
}

await prisma.$disconnect();
