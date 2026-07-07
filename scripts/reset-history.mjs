// Приводит историю тренировок в порядок: удаляет ВСЕ сессии и создаёт ровно
// ОДНУ выполненную тренировку у каждого пользователя (тот план, что реально делали),
// с корректной длительностью. Вес/достижения не трогает.
//
// Запуск из корня проекта:  node scripts/reset-history.mjs
//
// Настройка ниже: какой план считать выполненным и сколько минут у кого.

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// ── настрой под себя ──
const SEQ = 1; // порядковый номер тренировки, которую реально делали (1 = «Верх тела», пн)
const MINUTES = { r1soX: 94, lexa: 93 }; // длительность в минутах по логину
const DEFAULT_MINUTES = 90;
// ──────────────────────

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

const plan = await prisma.workoutPlan.findUnique({
  where: { sequence: SEQ },
  include: { exercises: { orderBy: { order: "asc" }, include: { exercise: true } } },
});
if (!plan) {
  console.error(`План с sequence=${SEQ} не найден. Сначала запусти npm run db:seed.`);
  process.exit(1);
}

const del = await prisma.workoutSession.deleteMany();
console.log(`Удалено старых сессий: ${del.count}`);

const users = await prisma.user.findMany();
for (const u of users) {
  const minutes = MINUTES[u.username] ?? DEFAULT_MINUTES;
  const durationSec = minutes * 60;
  const day = startOfDay(addDays(u.programStartDate, (plan.weekOfProgram - 1) * 7 + (plan.dayOfWeek - 1)));
  const started = new Date(day); started.setHours(18, 0, 0, 0);
  const ended = new Date(started.getTime() + durationSec * 1000);

  const s = await prisma.workoutSession.create({
    data: {
      userId: u.id,
      planId: plan.id,
      date: started,
      status: "completed",
      startedAt: started,
      endedAt: ended,
      durationSec,
      notes: "",
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
          setsData: JSON.stringify(Array.from({ length: it.sets }, () => ({ reps: it.reps, weight: "", done: true }))),
        })),
      },
    },
  });
  console.log(`${u.username}: 1 тренировка «${plan.title}» — ${minutes} мин (session #${s.id})`);
}

console.log("\nГотово. Теперь у каждого ровно одна выполненная тренировка.");
await prisma.$disconnect();
