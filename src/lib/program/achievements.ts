// Определения достижений и логика их разблокировки.

export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  icon: string; // имя иконки lucide
  tier: "bronze" | "silver" | "gold";
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { key: "first-workout", title: "Первый шаг", description: "Заверши свою первую тренировку", icon: "play", tier: "bronze" },
  { key: "workouts-10", title: "Втянулся", description: "10 завершённых тренировок", icon: "dumbbell", tier: "bronze" },
  { key: "workouts-25", title: "Постоянство", description: "25 завершённых тренировок", icon: "dumbbell", tier: "silver" },
  { key: "workouts-50", title: "Половина пути", description: "50 завершённых тренировок", icon: "dumbbell", tier: "silver" },
  { key: "workouts-100", title: "Сотня", description: "100 завершённых тренировок", icon: "medal", tier: "gold" },
  { key: "streak-3", title: "Разогрев", description: "3 тренировки подряд без пропусков", icon: "flame", tier: "bronze" },
  { key: "streak-6", title: "На волне", description: "6 тренировок подряд без пропусков", icon: "flame", tier: "silver" },
  { key: "streak-12", title: "Несокрушим", description: "12 тренировок подряд без пропусков", icon: "flame", tier: "gold" },
  { key: "weight-5", title: "-5 кг", description: "Сбрось первые 5 кг", icon: "trending-down", tier: "bronze" },
  { key: "weight-10", title: "-10 кг", description: "Сбрось 10 кг", icon: "trending-down", tier: "silver" },
  { key: "weight-20", title: "-20 кг", description: "Сбрось 20 кг", icon: "trending-down", tier: "silver" },
  { key: "weight-30", title: "-30 кг", description: "Сбрось 30 кг", icon: "trending-down", tier: "gold" },
  { key: "goal-reached", title: "Цель 80 кг!", description: "Достигни целевого веса", icon: "trophy", tier: "gold" },
  { key: "hours-10", title: "10 часов", description: "10 часов тренировок суммарно", icon: "clock", tier: "bronze" },
  { key: "hours-25", title: "25 часов", description: "25 часов тренировок суммарно", icon: "clock", tier: "silver" },
  { key: "month-done", title: "Первый месяц", description: "Заверши все тренировки одного месяца", icon: "calendar-check", tier: "silver" },
];

export interface AchievementStats {
  completedWorkouts: number;
  longestStreak: number;
  totalWeightLost: number;
  totalHours: number;
  reachedGoal: boolean;
  monthCompleted: boolean;
}

/** Возвращает набор ключей достижений, которые должны быть разблокированы. */
export function evaluateAchievements(s: AchievementStats): Set<string> {
  const unlocked = new Set<string>();
  const add = (k: string, cond: boolean) => cond && unlocked.add(k);

  add("first-workout", s.completedWorkouts >= 1);
  add("workouts-10", s.completedWorkouts >= 10);
  add("workouts-25", s.completedWorkouts >= 25);
  add("workouts-50", s.completedWorkouts >= 50);
  add("workouts-100", s.completedWorkouts >= 100);
  add("streak-3", s.longestStreak >= 3);
  add("streak-6", s.longestStreak >= 6);
  add("streak-12", s.longestStreak >= 12);
  add("weight-5", s.totalWeightLost >= 5);
  add("weight-10", s.totalWeightLost >= 10);
  add("weight-20", s.totalWeightLost >= 20);
  add("weight-30", s.totalWeightLost >= 30);
  add("goal-reached", s.reachedGoal);
  add("hours-10", s.totalHours >= 10);
  add("hours-25", s.totalHours >= 25);
  add("month-done", s.monthCompleted);

  return unlocked;
}
