"use server";

import { revalidatePath } from "next/cache";
import { startOfDay } from "date-fns";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { getSession } from "./auth";
import { getAllPlansWithMeta, computeStreaks } from "./data";
import { evaluateAchievements } from "./program/achievements";

async function requireUid(): Promise<number> {
  const session = await getSession();
  if (!session) throw new Error("Не авторизован");
  return session.uid;
}

// ─────────────────────────────────────────────
// Тренировки
// ─────────────────────────────────────────────
export async function startWorkout(planId: number): Promise<number> {
  const uid = await requireUid();

  const existing = await prisma.workoutSession.findUnique({
    where: { userId_planId: { userId: uid, planId } },
  });
  if (existing) return existing.id;

  const plan = await prisma.workoutPlan.findUnique({
    where: { id: planId },
    include: {
      exercises: { orderBy: { order: "asc" }, include: { exercise: true } },
    },
  });
  if (!plan) throw new Error("Тренировка не найдена");

  const session = await prisma.workoutSession.create({
    data: {
      userId: uid,
      planId,
      date: new Date(),
      status: "in_progress",
      startedAt: new Date(),
      exerciseLogs: {
        create: plan.exercises.map((it) => {
          const setsData = Array.from({ length: it.sets }, () => ({
            reps: it.reps,
            weight: "",
            done: false,
          }));
          return {
            order: it.order,
            exerciseSlug: it.exercise.slug,
            exerciseName: it.exercise.name,
            targetSets: it.sets,
            targetReps: it.reps,
            targetWeight: it.weightAdvice,
            restSeconds: it.restSeconds,
            status: "pending",
            setsData: JSON.stringify(setsData),
          };
        }),
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath("/history");
  return session.id;
}

export async function updateExerciseLog(
  logId: number,
  data: { status?: string; setsData?: unknown; replacedWithSlug?: string | null },
): Promise<void> {
  await requireUid();
  await prisma.exerciseLog.update({
    where: { id: logId },
    data: {
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.setsData !== undefined ? { setsData: JSON.stringify(data.setsData) } : {}),
      ...(data.replacedWithSlug !== undefined
        ? { replacedWithSlug: data.replacedWithSlug }
        : {}),
    },
  });
}

export async function replaceExercise(logId: number, newSlug: string): Promise<void> {
  await requireUid();
  const ex = await prisma.exercise.findUnique({ where: { slug: newSlug } });
  if (!ex) throw new Error("Упражнение не найдено");
  await prisma.exerciseLog.update({
    where: { id: logId },
    data: {
      exerciseSlug: ex.slug,
      exerciseName: ex.name,
      replacedWithSlug: newSlug,
      status: "replaced",
    },
  });
}

export async function finishWorkout(
  sessionId: number,
  data: {
    notes?: string;
    feelings?: string;
    difficulty?: number | null;
    mood?: number | null;
    pain?: number | null;
    durationSec?: number;
  },
): Promise<void> {
  await requireUid();
  const now = new Date();
  const session = await prisma.workoutSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error("Сессия не найдена");

  const durationSec =
    data.durationSec ??
    (session.startedAt
      ? Math.round((now.getTime() - session.startedAt.getTime()) / 1000)
      : null);

  await prisma.workoutSession.update({
    where: { id: sessionId },
    data: {
      status: "completed",
      endedAt: now,
      durationSec: durationSec ?? undefined,
      notes: data.notes ?? "",
      feelings: data.feelings ?? "",
      difficulty: data.difficulty ?? null,
      mood: data.mood ?? null,
      pain: data.pain ?? null,
    },
  });

  await syncAchievements();
  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath("/history");
  revalidatePath("/stats");
  revalidatePath("/together");
}

// Завершение тренировки одним вызовом: сохраняем все логи подходов и закрываем
// сессию. Используется бегунком тренировки, в т.ч. для дозаписи после офлайна.
export async function completeWorkout(
  sessionId: number,
  payload: {
    logs: { id: number; status: string; setsData: unknown }[];
    notes?: string;
    feelings?: string;
    difficulty?: number | null;
    mood?: number | null;
    pain?: number | null;
    durationSec?: number;
  },
): Promise<void> {
  await requireUid();
  const now = new Date();
  const session = await prisma.workoutSession.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error("Сессия не найдена");

  for (const l of payload.logs) {
    await prisma.exerciseLog
      .update({
        where: { id: l.id },
        data: { status: l.status, setsData: JSON.stringify(l.setsData) },
      })
      .catch(() => {});
  }

  const durationSec =
    payload.durationSec ??
    (session.startedAt
      ? Math.round((now.getTime() - session.startedAt.getTime()) / 1000)
      : null);

  await prisma.workoutSession.update({
    where: { id: sessionId },
    data: {
      status: "completed",
      endedAt: now,
      durationSec: durationSec ?? undefined,
      notes: payload.notes ?? "",
      feelings: payload.feelings ?? "",
      difficulty: payload.difficulty ?? null,
      mood: payload.mood ?? null,
      pain: payload.pain ?? null,
    },
  });

  await syncAchievements();
  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath("/history");
  revalidatePath("/stats");
  revalidatePath("/together");
}

export async function skipWorkout(planId: number, note = ""): Promise<void> {
  const uid = await requireUid();
  await prisma.workoutSession.upsert({
    where: { userId_planId: { userId: uid, planId } },
    update: { status: "skipped", notes: note, endedAt: new Date() },
    create: {
      userId: uid,
      planId,
      date: new Date(),
      status: "skipped",
      notes: note,
    },
  });
  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath("/history");
}

export async function deleteSession(sessionId: number): Promise<void> {
  await requireUid();
  await prisma.workoutSession.delete({ where: { id: sessionId } });
  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath("/history");
  revalidatePath("/stats");
}

// ─────────────────────────────────────────────
// Вес
// ─────────────────────────────────────────────
export async function addWeightEntry(data: {
  weight: number;
  note?: string;
  date?: string;
}): Promise<void> {
  const uid = await requireUid();
  const date = data.date ? startOfDay(new Date(data.date)) : startOfDay(new Date());

  const existing = await prisma.weightEntry.findFirst({
    where: {
      userId: uid,
      date: { gte: date, lt: new Date(date.getTime() + 86_400_000) },
    },
  });
  if (existing) {
    await prisma.weightEntry.update({
      where: { id: existing.id },
      data: { weight: data.weight, note: data.note ?? "" },
    });
  } else {
    await prisma.weightEntry.create({
      data: { userId: uid, weight: data.weight, note: data.note ?? "", date },
    });
  }

  await prisma.user.update({ where: { id: uid }, data: { currentWeight: data.weight } });
  await syncAchievements();
  revalidatePath("/");
  revalidatePath("/weight");
  revalidatePath("/calendar");
  revalidatePath("/stats");
  revalidatePath("/together");
}

export async function deleteWeightEntry(id: number): Promise<void> {
  const uid = await requireUid();
  const entry = await prisma.weightEntry.findUnique({ where: { id } });
  if (!entry || entry.userId !== uid) return;
  await prisma.weightEntry.delete({ where: { id } });
  revalidatePath("/weight");
  revalidatePath("/");
  revalidatePath("/stats");
}

// ─────────────────────────────────────────────
// Настройки
// ─────────────────────────────────────────────
export async function updateSettings(data: {
  name?: string;
  currentWeight?: number;
  goalWeight?: number;
  startWeight?: number;
  age?: number;
  heightCm?: number;
  unit?: string;
  theme?: string;
}): Promise<void> {
  const uid = await requireUid();
  await prisma.user.update({
    where: { id: uid },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.currentWeight !== undefined ? { currentWeight: data.currentWeight } : {}),
      ...(data.goalWeight !== undefined ? { goalWeight: data.goalWeight } : {}),
      ...(data.startWeight !== undefined ? { startWeight: data.startWeight } : {}),
      ...(data.age !== undefined ? { age: data.age } : {}),
      ...(data.heightCm !== undefined ? { heightCm: data.heightCm } : {}),
      ...(data.unit !== undefined ? { unit: data.unit } : {}),
      ...(data.theme !== undefined ? { theme: data.theme } : {}),
    },
  });
  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/weight");
  revalidatePath("/together");
}

export async function changePassword(
  current: string,
  next: string,
): Promise<{ ok: boolean; error?: string }> {
  const uid = await requireUid();
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) return { ok: false, error: "Пользователь не найден" };
  const ok = await bcrypt.compare(current, user.passwordHash);
  if (!ok) return { ok: false, error: "Текущий пароль неверный" };
  if (next.length < 6) return { ok: false, error: "Новый пароль слишком короткий (мин. 6)" };
  const passwordHash = await bcrypt.hash(next, 10);
  await prisma.user.update({ where: { id: uid }, data: { passwordHash } });
  return { ok: true };
}

// ─────────────────────────────────────────────
// Избранные упражнения (per-user)
// ─────────────────────────────────────────────
export async function toggleFavorite(slug: string): Promise<void> {
  const uid = await requireUid();
  const existing = await prisma.favorite.findUnique({
    where: { userId_exerciseSlug: { userId: uid, exerciseSlug: slug } },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.favorite.create({ data: { userId: uid, exerciseSlug: slug } });
  }
  revalidatePath("/exercises");
  revalidatePath(`/exercises/${slug}`);
}

// ─────────────────────────────────────────────
// Достижения (per-user)
// ─────────────────────────────────────────────
export async function syncAchievements(): Promise<void> {
  const uid = await requireUid().catch(() => null);
  if (!uid) return;
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) return;

  const today = startOfDay(new Date());
  const plans = await getAllPlansWithMeta(user.programStartDate, user.id);
  const completed = plans.filter((p) => p.status === "completed").length;
  const streak = computeStreaks(plans, today);

  const sessions = await prisma.workoutSession.findMany({
    where: { userId: user.id, status: "completed" },
    select: { durationSec: true },
  });
  const totalHours = sessions.reduce((s, x) => s + (x.durationSec ?? 0), 0) / 3600;

  const latest = await prisma.weightEntry.findFirst({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });
  const currentWeight = latest?.weight ?? user.currentWeight;
  const totalWeightLost = Math.max(0, user.startWeight - currentWeight);

  const byMonth = new Map<number, string[]>();
  for (const p of plans) {
    if (!byMonth.has(p.month)) byMonth.set(p.month, []);
    byMonth.get(p.month)!.push(p.status);
  }
  let monthCompleted = false;
  for (const [, list] of byMonth) {
    if (list.length > 0 && list.every((s) => s === "completed")) {
      monthCompleted = true;
      break;
    }
  }

  const shouldUnlock = evaluateAchievements({
    completedWorkouts: completed,
    longestStreak: streak.longest,
    totalWeightLost,
    totalHours,
    reachedGoal: currentWeight <= user.goalWeight,
    monthCompleted,
  });

  const all = await prisma.achievement.findMany({ where: { userId: user.id } });
  for (const a of all) {
    if (shouldUnlock.has(a.key) && !a.unlockedAt) {
      await prisma.achievement.update({
        where: { id: a.id },
        data: { unlockedAt: new Date() },
      });
    }
  }
  revalidatePath("/achievements");
}

// ─────────────────────────────────────────────
// Экспорт / импорт данных (текущего пользователя)
// ─────────────────────────────────────────────
export async function exportData(): Promise<string> {
  const uid = await requireUid();
  const [user, weights, sessions, achievements, favorites] = await Promise.all([
    prisma.user.findUnique({ where: { id: uid } }),
    prisma.weightEntry.findMany({ where: { userId: uid }, orderBy: { date: "asc" } }),
    prisma.workoutSession.findMany({ where: { userId: uid }, include: { exerciseLogs: true } }),
    prisma.achievement.findMany({ where: { userId: uid } }),
    prisma.favorite.findMany({ where: { userId: uid }, select: { exerciseSlug: true } }),
  ]);
  return JSON.stringify(
    {
      version: 2,
      exportedAt: new Date().toISOString(),
      user: user
        ? {
            name: user.name,
            age: user.age,
            heightCm: user.heightCm,
            startWeight: user.startWeight,
            currentWeight: user.currentWeight,
            goalWeight: user.goalWeight,
            unit: user.unit,
            theme: user.theme,
            programStartDate: user.programStartDate,
          }
        : null,
      weights: weights.map((w) => ({ weight: w.weight, note: w.note, date: w.date })),
      sessions,
      achievements: achievements.map((a) => ({ key: a.key, unlockedAt: a.unlockedAt })),
      favorites: favorites.map((f) => f.exerciseSlug),
    },
    null,
    2,
  );
}

export async function importData(json: string): Promise<{ ok: boolean; error?: string }> {
  const uid = await requireUid();
  let data: ImportShape;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, error: "Файл повреждён или это не JSON" };
  }
  try {
    if (data.user) {
      await prisma.user.update({
        where: { id: uid },
        data: {
          name: data.user.name ?? undefined,
          age: data.user.age ?? undefined,
          heightCm: data.user.heightCm ?? undefined,
          startWeight: data.user.startWeight ?? undefined,
          currentWeight: data.user.currentWeight ?? undefined,
          goalWeight: data.user.goalWeight ?? undefined,
          unit: data.user.unit ?? undefined,
          theme: data.user.theme ?? undefined,
          ...(data.user.programStartDate
            ? { programStartDate: new Date(data.user.programStartDate) }
            : {}),
        },
      });
    }
    if (Array.isArray(data.weights)) {
      await prisma.weightEntry.deleteMany({ where: { userId: uid } });
      for (const w of data.weights) {
        await prisma.weightEntry.create({
          data: { userId: uid, weight: w.weight, note: w.note ?? "", date: new Date(w.date) },
        });
      }
    }
    if (Array.isArray(data.favorites)) {
      await prisma.favorite.deleteMany({ where: { userId: uid } });
      for (const slug of data.favorites) {
        await prisma.favorite.create({ data: { userId: uid, exerciseSlug: slug } }).catch(() => {});
      }
    }
    await syncAchievements();
    revalidatePath("/");
    revalidatePath("/weight");
    revalidatePath("/settings");
    return { ok: true };
  } catch {
    return { ok: false, error: "Не удалось импортировать данные" };
  }
}

interface ImportShape {
  user?: {
    name?: string;
    age?: number;
    heightCm?: number;
    startWeight?: number;
    currentWeight?: number;
    goalWeight?: number;
    unit?: string;
    theme?: string;
    programStartDate?: string;
  } | null;
  weights?: { weight: number; note?: string; date: string }[];
  favorites?: string[];
}
