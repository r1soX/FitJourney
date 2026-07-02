// Заполнение базы: пользователь, библиотека упражнений, годовая программа,
// достижения и стартовая запись веса.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { EXERCISES } from "../src/lib/program/exercises";
import { generateProgram } from "../src/lib/program/generator";
import { ACHIEVEMENTS } from "../src/lib/program/achievements";
import { START_WEIGHT, GOAL_WEIGHT } from "../src/lib/program/weightPlan";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Заполнение базы данных FitJourney...");

  const username = process.env.APP_USERNAME || "r1soX";
  const password = process.env.APP_PASSWORD || "15253565vV";
  const passwordHash = await bcrypt.hash(password, 10);

  // ── Пользователь ──
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  // Старт программы — ближайший понедельник (сегодня, если сегодня понедельник),
  // чтобы недели ложились ровно и не было «пропущенных» дней до старта.
  const programStart = new Date(startOfDay);
  const dow = (programStart.getDay() + 6) % 7; // 0 = понедельник
  if (dow !== 0) programStart.setDate(programStart.getDate() + (7 - dow));

  await prisma.user.upsert({
    where: { username },
    update: { passwordHash },
    create: {
      username,
      passwordHash,
      name: "Атлет",
      age: 26,
      heightCm: 185,
      startWeight: START_WEIGHT,
      currentWeight: START_WEIGHT,
      goalWeight: GOAL_WEIGHT,
      unit: "kg",
      theme: "dark",
      programStartDate: programStart,
    },
  });
  console.log(`✓ Пользователь «${username}» готов`);

  // ── Библиотека упражнений ──
  await prisma.workoutExercise.deleteMany();
  await prisma.workoutPlan.deleteMany();
  await prisma.exercise.deleteMany();

  for (const ex of EXERCISES) {
    await prisma.exercise.create({
      data: {
        slug: ex.slug,
        name: ex.name,
        category: ex.category,
        muscleGroup: ex.muscleGroup,
        equipment: ex.equipment,
        description: ex.description,
        technique: ex.technique,
        tips: ex.tips,
        alternativeSlugs: JSON.stringify(ex.alternatives),
      },
    });
  }
  console.log(`✓ Загружено упражнений: ${EXERCISES.length}`);

  const exerciseIdBySlug = new Map<string, number>();
  for (const ex of await prisma.exercise.findMany({ select: { id: true, slug: true } })) {
    exerciseIdBySlug.set(ex.slug, ex.id);
  }

  // ── Годовая программа ──
  const program = generateProgram();
  let itemCount = 0;
  for (const plan of program) {
    const created = await prisma.workoutPlan.create({
      data: {
        sequence: plan.sequence,
        month: plan.month,
        weekOfProgram: plan.weekOfProgram,
        weekOfMonth: plan.weekOfMonth,
        dayOfWeek: plan.dayOfWeek,
        phase: plan.phase,
        title: plan.title,
        focus: plan.focus,
        warmup: plan.warmup,
        cardio: plan.cardio,
        cooldown: plan.cooldown,
        restAdvice: plan.restAdvice,
        notes: plan.notes,
        estMinutes: plan.estMinutes,
        isDeload: plan.isDeload,
      },
    });

    const items = plan.exercises
      .map((it) => {
        const exerciseId = exerciseIdBySlug.get(it.slug);
        if (!exerciseId) {
          console.warn(`⚠ Не найдено упражнение: ${it.slug}`);
          return null;
        }
        return {
          planId: created.id,
          exerciseId,
          order: it.order,
          block: it.block,
          sets: it.sets,
          reps: it.reps,
          weightAdvice: it.weightAdvice,
          restSeconds: it.restSeconds,
          note: it.note,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    await prisma.workoutExercise.createMany({ data: items });
    itemCount += items.length;
  }
  console.log(`✓ Создано тренировок: ${program.length}, элементов: ${itemCount}`);

  // ── Достижения ──
  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { key: a.key },
      update: { title: a.title, description: a.description, icon: a.icon, tier: a.tier },
      create: {
        key: a.key,
        title: a.title,
        description: a.description,
        icon: a.icon,
        tier: a.tier,
      },
    });
  }
  console.log(`✓ Достижений: ${ACHIEVEMENTS.length}`);

  // ── Стартовая запись веса ──
  const existingWeight = await prisma.weightEntry.count();
  if (existingWeight === 0) {
    await prisma.weightEntry.create({
      data: {
        date: startOfDay,
        weight: START_WEIGHT,
        note: "Старт программы 💪",
      },
    });
    console.log("✓ Добавлена стартовая запись веса");
  }

  console.log("✅ Готово!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
