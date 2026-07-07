// Заполнение базы: два пользователя (владелец + друг), общая библиотека упражнений
// и годовая программа, персональные достижения и стартовые записи веса.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { EXERCISES } from "../src/lib/program/exercises";
import { generateProgram } from "../src/lib/program/generator";
import { ACHIEVEMENTS } from "../src/lib/program/achievements";
import { START_WEIGHT, GOAL_WEIGHT } from "../src/lib/program/weightPlan";

const prisma = new PrismaClient();

async function upsertUser(opts: {
  username: string;
  password: string;
  name: string;
  age: number;
  heightCm: number;
  startWeight: number;
  goalWeight: number;
  programStart: Date;
}) {
  const passwordHash = await bcrypt.hash(opts.password, 10);
  const user = await prisma.user.upsert({
    where: { username: opts.username },
    update: { passwordHash },
    create: {
      username: opts.username,
      passwordHash,
      name: opts.name,
      age: opts.age,
      heightCm: opts.heightCm,
      startWeight: opts.startWeight,
      currentWeight: opts.startWeight,
      goalWeight: opts.goalWeight,
      unit: "kg",
      theme: "dark",
      programStartDate: opts.programStart,
    },
  });

  // Достижения — по одному комплекту на пользователя
  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { userId_key: { userId: user.id, key: a.key } },
      update: { title: a.title, description: a.description, icon: a.icon, tier: a.tier },
      create: {
        userId: user.id,
        key: a.key,
        title: a.title,
        description: a.description,
        icon: a.icon,
        tier: a.tier,
      },
    });
  }

  // Стартовая запись веса
  const hasWeight = await prisma.weightEntry.count({ where: { userId: user.id } });
  if (hasWeight === 0) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    await prisma.weightEntry.create({
      data: {
        userId: user.id,
        date: startOfDay,
        weight: opts.startWeight,
        note: "Старт программы 💪",
      },
    });
  }

  return user;
}

async function main() {
  console.log("🌱 Заполнение базы данных FitJourney...");

  // Старт программы — ближайший понедельник (общий для обоих)
  const programStart = new Date();
  programStart.setHours(0, 0, 0, 0);
  const dow = (programStart.getDay() + 6) % 7; // 0 = понедельник
  if (dow !== 0) programStart.setDate(programStart.getDate() + (7 - dow));

  // ── Пользователи ──
  const owner = await upsertUser({
    username: process.env.APP_USERNAME || "r1soX",
    password: process.env.APP_PASSWORD || "15253565vV",
    name: "Атлет",
    age: 26,
    heightCm: 185,
    startWeight: START_WEIGHT,
    goalWeight: GOAL_WEIGHT,
    programStart,
  });
  console.log(`✓ Пользователь «${owner.username}» готов`);

  const friend = await upsertUser({
    username: process.env.APP2_USERNAME || "lexa",
    password: process.env.APP2_PASSWORD || "123456qq",
    name: "Лёха",
    age: 26,
    heightCm: 180,
    startWeight: 100,
    goalWeight: 80,
    programStart,
  });
  console.log(`✓ Пользователь «${friend.username}» готов`);

  // ── Библиотека упражнений (общая) ──
  // ВАЖНО: без deleteMany — обновляем по месту (upsert), чтобы НЕ рвать историю
  // тренировок пользователей при повторном запуске сида в проде.
  for (const ex of EXERCISES) {
    const data = {
      name: ex.name,
      category: ex.category,
      muscleGroup: ex.muscleGroup,
      equipment: ex.equipment,
      description: ex.description,
      technique: ex.technique,
      tips: ex.tips,
      alternativeSlugs: JSON.stringify(ex.alternatives),
    };
    await prisma.exercise.upsert({
      where: { slug: ex.slug },
      update: data,
      create: { slug: ex.slug, ...data },
    });
  }
  console.log(`✓ Загружено упражнений: ${EXERCISES.length}`);

  const exerciseIdBySlug = new Map<string, number>();
  for (const ex of await prisma.exercise.findMany({ select: { id: true, slug: true } })) {
    exerciseIdBySlug.set(ex.slug, ex.id);
  }

  // ── Годовая программа (общая) ──
  // Планы обновляются upsert по sequence — id планов остаются стабильными,
  // поэтому завершённые тренировки сохраняют привязку и НЕ становятся «пропущенными».
  const program = generateProgram();
  let itemCount = 0;
  for (const plan of program) {
    const fields = {
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
    };
    const created = await prisma.workoutPlan.upsert({
      where: { sequence: plan.sequence },
      update: fields,
      create: { sequence: plan.sequence, ...fields },
    });

    // пересобираем упражнения этого плана (историю в ExerciseLog это не трогает)
    await prisma.workoutExercise.deleteMany({ where: { planId: created.id } });

    const items = plan.exercises
      .map((it) => {
        const exerciseId = exerciseIdBySlug.get(it.slug);
        if (!exerciseId) return null;
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

  // Убираем лишние планы (если программа стала короче) и упражнения, которых
  // больше нет в библиотеке. ExerciseLog хранит slug/имя отдельно — история цела.
  await prisma.workoutPlan.deleteMany({ where: { sequence: { gt: program.length } } });
  const keepSlugs = EXERCISES.map((e) => e.slug);
  await prisma.exercise.deleteMany({ where: { slug: { notIn: keepSlugs } } });

  console.log(`✓ Обновлено тренировок: ${program.length}, элементов: ${itemCount}`);

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
