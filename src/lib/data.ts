import "server-only";
import { addDays, differenceInCalendarDays, startOfDay, isSameDay } from "date-fns";
import { prisma } from "./prisma";
import { getSession } from "./auth";
import { targetWeightForDate, forecastGoalDate } from "./program/weightPlan";

const TOTAL_WORKOUTS = 156; // 52 недели × 3

type UserRecord = NonNullable<Awaited<ReturnType<typeof getUserById>>>;

async function getUserById(id: number) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.uid } });
}

/** Партнёр по тренировкам — второй пользователь приложения. */
export async function getPartner(userId: number) {
  return prisma.user.findFirst({
    where: { id: { not: userId } },
    orderBy: { id: "asc" },
  });
}

/** Дата запланированной тренировки. programStart — понедельник недели 1. */
export function planDate(programStart: Date, weekOfProgram: number, dayOfWeek: number): Date {
  return startOfDay(addDays(programStart, (weekOfProgram - 1) * 7 + (dayOfWeek - 1)));
}

export type PlanStatus = "completed" | "skipped" | "today" | "upcoming" | "missed";

export interface PlanWithMeta {
  id: number;
  sequence: number;
  month: number;
  weekOfProgram: number;
  weekOfMonth: number;
  dayOfWeek: number;
  phase: string;
  title: string;
  focus: string;
  estMinutes: number;
  isDeload: boolean;
  date: Date;
  status: PlanStatus;
  sessionId: number | null;
  sessionStatus: string | null;
}

interface PlanRow {
  id: number;
  sequence: number;
  month: number;
  weekOfProgram: number;
  weekOfMonth: number;
  dayOfWeek: number;
  phase: string;
  title: string;
  focus: string;
  estMinutes: number;
  isDeload: boolean;
  sessions: { id: number; status: string }[];
}

function decorate(plan: PlanRow, programStart: Date, today: Date): PlanWithMeta {
  const date = planDate(programStart, plan.weekOfProgram, plan.dayOfWeek);
  const sess = plan.sessions[0] ?? null;
  let status: PlanStatus;
  if (sess?.status === "completed") status = "completed";
  else if (sess?.status === "skipped") status = "skipped";
  else if (isSameDay(date, today)) status = "today";
  else if (date < today) status = "missed";
  else status = "upcoming";
  return {
    id: plan.id,
    sequence: plan.sequence,
    month: plan.month,
    weekOfProgram: plan.weekOfProgram,
    weekOfMonth: plan.weekOfMonth,
    dayOfWeek: plan.dayOfWeek,
    phase: plan.phase,
    title: plan.title,
    focus: plan.focus,
    estMinutes: plan.estMinutes,
    isDeload: plan.isDeload,
    date,
    status,
    sessionId: sess?.id ?? null,
    sessionStatus: sess?.status ?? null,
  };
}

export async function getAllPlansWithMeta(
  programStart: Date,
  userId: number,
): Promise<PlanWithMeta[]> {
  const today = startOfDay(new Date());
  const plans = await prisma.workoutPlan.findMany({
    orderBy: { sequence: "asc" },
    include: {
      sessions: { where: { userId }, select: { id: true, status: true } },
    },
  });
  return plans.map((p) => decorate(p as PlanRow, programStart, today));
}

/** Ближайшая тренировка: сегодняшняя (если не завершена) или следующая будущая. */
export function findNextPlan(plans: PlanWithMeta[]): PlanWithMeta | null {
  const today = plans.find((p) => p.status === "today");
  if (today) return today;
  const upcoming = plans.find((p) => p.status === "upcoming");
  return upcoming ?? null;
}

export interface StreakInfo {
  current: number;
  longest: number;
}

export function computeStreaks(plans: PlanWithMeta[], today: Date): StreakInfo {
  const past = plans
    .filter((p) => p.date <= today)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  let cur = 0;
  let longest = 0;
  for (const p of past) {
    if (p.status === "completed") {
      cur += 1;
      longest = Math.max(longest, cur);
    } else if (p.date < today) {
      cur = 0;
    }
  }
  return { current: cur, longest };
}

export async function getLatestWeight(userId: number): Promise<number | null> {
  const entry = await prisma.weightEntry.findFirst({
    where: { userId },
    orderBy: { date: "desc" },
  });
  return entry?.weight ?? null;
}

export interface DashboardData {
  user: UserRecord;
  currentWeight: number;
  startWeight: number;
  goalWeight: number;
  toLose: number;
  lost: number;
  weightProgress: number;
  onTrackDelta: number;
  completed: number;
  missed: number;
  totalWorkouts: number;
  programProgress: number;
  currentWeek: number;
  currentMonth: number;
  streak: StreakInfo;
  nextPlan: PlanWithMeta | null;
  todayIsWorkout: boolean;
}

export async function getDashboardData(): Promise<DashboardData | null> {
  const user = await getUser();
  if (!user) return null;

  const today = startOfDay(new Date());
  const plans = await getAllPlansWithMeta(user.programStartDate, user.id);
  const latestWeight = await getLatestWeight(user.id);
  const currentWeight = latestWeight ?? user.currentWeight;

  const completed = plans.filter((p) => p.status === "completed").length;
  const missed = plans.filter((p) => p.status === "missed").length;

  const toLose = user.startWeight - user.goalWeight;
  const lost = Math.max(0, user.startWeight - currentWeight);
  const weightProgress = toLose > 0 ? Math.min(100, (lost / toLose) * 100) : 0;

  const target = targetWeightForDate(user.programStartDate, today, user.startWeight, user.goalWeight);
  const onTrackDelta = target - currentWeight;

  const daysSince = Math.max(0, differenceInCalendarDays(today, startOfDay(user.programStartDate)));
  const currentWeek = Math.min(52, Math.floor(daysSince / 7) + 1);
  const nextPlan = findNextPlan(plans);
  const currentMonth = nextPlan?.month ?? Math.min(12, Math.ceil(currentWeek / 4.34));

  const streak = computeStreaks(plans, today);

  return {
    user,
    currentWeight,
    startWeight: user.startWeight,
    goalWeight: user.goalWeight,
    toLose,
    lost,
    weightProgress,
    onTrackDelta,
    completed,
    missed,
    totalWorkouts: TOTAL_WORKOUTS,
    programProgress: (completed / TOTAL_WORKOUTS) * 100,
    currentWeek,
    currentMonth,
    streak,
    nextPlan,
    todayIsWorkout: plans.some((p) => p.status === "today"),
  };
}

export interface FullStats {
  completed: number;
  missed: number;
  totalWorkouts: number;
  completionRate: number;
  weightLost: number;
  avgWeeklyRate: number;
  longestStreak: number;
  currentStreak: number;
  totalSeconds: number;
  avgSessionSeconds: number;
  forecastDate: Date | null;
  currentWeight: number;
  totalHours: number;
}

export async function getFullStats(): Promise<FullStats | null> {
  const user = await getUser();
  if (!user) return null;
  return computeStatsForUser(user);
}

async function computeStatsForUser(user: UserRecord): Promise<FullStats> {
  const today = startOfDay(new Date());
  const plans = await getAllPlansWithMeta(user.programStartDate, user.id);
  const sessions = await prisma.workoutSession.findMany({
    where: { userId: user.id, status: "completed" },
    select: { durationSec: true },
  });
  const weights = await prisma.weightEntry.findMany({
    where: { userId: user.id },
    orderBy: { date: "asc" },
  });

  const completed = plans.filter((p) => p.status === "completed").length;
  const missed = plans.filter((p) => p.status === "missed").length;
  const attempted = completed + missed;

  const totalSeconds = sessions.reduce((s, x) => s + (x.durationSec ?? 0), 0);
  const withDuration = sessions.filter((s) => (s.durationSec ?? 0) > 0);
  const avgSessionSeconds = withDuration.length
    ? Math.round(totalSeconds / withDuration.length)
    : 0;

  const currentWeight = weights.length ? weights[weights.length - 1].weight : user.currentWeight;
  const weightLost = Math.max(0, user.startWeight - currentWeight);

  let avgWeeklyRate = 0;
  if (weights.length >= 2) {
    const first = weights[0];
    const last = weights[weights.length - 1];
    const weeks = Math.max(1, differenceInCalendarDays(last.date, first.date) / 7);
    avgWeeklyRate = (first.weight - last.weight) / weeks;
  }

  const streak = computeStreaks(plans, today);
  const forecastDate = forecastGoalDate(
    currentWeight,
    avgWeeklyRate > 0 ? avgWeeklyRate : 0.9,
    user.goalWeight,
  );

  return {
    completed,
    missed,
    totalWorkouts: TOTAL_WORKOUTS,
    completionRate: attempted > 0 ? (completed / attempted) * 100 : 0,
    weightLost,
    avgWeeklyRate,
    longestStreak: streak.longest,
    currentStreak: streak.current,
    totalSeconds,
    avgSessionSeconds,
    forecastDate,
    currentWeight,
    totalHours: totalSeconds / 3600,
  };
}

// ─────────────────────────────────────────────
// Экран «Вместе» — сравнение и общий итог
// ─────────────────────────────────────────────
export interface PersonSummary {
  id: number;
  name: string;
  username: string;
  isCurrent: boolean;
  startWeight: number;
  currentWeight: number;
  goalWeight: number;
  lost: number;
  toLose: number;
  weightProgress: number;
  completed: number;
  missed: number;
  currentStreak: number;
  longestStreak: number;
  totalHours: number;
  onTrackDelta: number;
}

async function summarizePerson(user: UserRecord, isCurrent: boolean): Promise<PersonSummary> {
  const stats = await computeStatsForUser(user);
  const today = startOfDay(new Date());
  const target = targetWeightForDate(user.programStartDate, today, user.startWeight, user.goalWeight);
  const toLose = user.startWeight - user.goalWeight;
  const lost = stats.weightLost;
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    isCurrent,
    startWeight: user.startWeight,
    currentWeight: stats.currentWeight,
    goalWeight: user.goalWeight,
    lost,
    toLose,
    weightProgress: toLose > 0 ? Math.min(100, (lost / toLose) * 100) : 0,
    completed: stats.completed,
    missed: stats.missed,
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    totalHours: stats.totalHours,
    onTrackDelta: target - stats.currentWeight,
  };
}

export interface ComparisonData {
  people: PersonSummary[]; // [текущий, партнёр?]
  combined: {
    lost: number;
    completed: number;
    totalHours: number;
    workoutsTogether: number; // тренировки, выполненные обоими в один день
  };
  hasPartner: boolean;
}

export async function getComparisonData(): Promise<ComparisonData | null> {
  const me = await getUser();
  if (!me) return null;
  const partner = await getPartner(me.id);

  const people: PersonSummary[] = [await summarizePerson(me, true)];
  if (partner) people.push(await summarizePerson(partner, false));

  let workoutsTogether = 0;
  if (partner) {
    const [mine, theirs] = await Promise.all([
      prisma.workoutSession.findMany({
        where: { userId: me.id, status: "completed" },
        select: { date: true },
      }),
      prisma.workoutSession.findMany({
        where: { userId: partner.id, status: "completed" },
        select: { date: true },
      }),
    ]);
    const dayKey = (d: Date) => startOfDay(d).getTime();
    const theirDays = new Set(theirs.map((s) => dayKey(s.date)));
    const seen = new Set<number>();
    for (const s of mine) {
      const k = dayKey(s.date);
      if (theirDays.has(k) && !seen.has(k)) {
        seen.add(k);
        workoutsTogether += 1;
      }
    }
  }

  return {
    people,
    combined: {
      lost: people.reduce((s, p) => s + p.lost, 0),
      completed: people.reduce((s, p) => s + p.completed, 0),
      totalHours: people.reduce((s, p) => s + p.totalHours, 0),
      workoutsTogether,
    },
    hasPartner: !!partner,
  };
}

export { TOTAL_WORKOUTS };
