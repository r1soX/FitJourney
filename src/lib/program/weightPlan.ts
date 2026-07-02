// Модель графика похудения FitJourney. Кривая слегка «фронт-загружена»:
// в начале при большой массе вес уходит быстрее, ближе к цели темп замедляется.
// Функции принимают персональные start/goal, т.к. у разных пользователей свои цифры.

// Значения по умолчанию (владелец): 126 → 80 кг.
export const START_WEIGHT = 126;
export const GOAL_WEIGHT = 80;
export const PROGRAM_DAYS = 365;

/** Доля пройденного пути (0..1) с фронт-загрузкой. */
function lossFraction(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - clamped, 1.25);
}

/** Целевой вес на момент t (0 = старт, 1 = год). */
export function targetWeightAtProgress(
  t: number,
  start = START_WEIGHT,
  goal = GOAL_WEIGHT,
): number {
  return start - (start - goal) * lossFraction(t);
}

/** Целевой вес на дату относительно старта программы. */
export function targetWeightForDate(
  startDate: Date,
  date: Date,
  start = START_WEIGHT,
  goal = GOAL_WEIGHT,
): number {
  const days = (date.getTime() - startDate.getTime()) / 86_400_000;
  const t = days / PROGRAM_DAYS;
  return targetWeightAtProgress(t, start, goal);
}

export interface Milestone {
  month: number;
  targetWeight: number;
  lostByThen: number;
  label: string;
}

/** Контрольные точки по месяцам (целевой вес на конец месяца). */
export function monthlyMilestones(start = START_WEIGHT, goal = GOAL_WEIGHT): Milestone[] {
  const list: Milestone[] = [];
  for (let m = 1; m <= 12; m++) {
    const w = Math.round(targetWeightAtProgress(m / 12, start, goal) * 10) / 10;
    list.push({
      month: m,
      targetWeight: w,
      lostByThen: Math.round((start - w) * 10) / 10,
      label: `Месяц ${m}`,
    });
  }
  // Гарантируем ровную цель в финале
  list[11].targetWeight = goal;
  list[11].lostByThen = Math.round((start - goal) * 10) / 10;
  return list;
}

export const SAFE_WEEKLY_RATE = {
  min: 0.5,
  max: 1.2,
  recommended: 0.9,
};

export const PLATEAU_ADVICE = [
  "Плато 1–2 недели — это норма, особенно после быстрого старта. Не паникуй и не режь калории резко.",
  "Проверь сон: недосып повышает кортизол и задерживает воду, маскируя реальный жир.",
  "Добавь 1000–2000 шагов в день вместо урезания еды — так проще сохранить мышцы.",
  "Пересчитай порции: с падением веса снижается и суточная потребность в калориях.",
  "Взвешивайся в одно время (утром, натощак) и смотри на среднее за неделю, а не на один день.",
  "Замеряй талию сантиметром: иногда вес стоит, а объёмы уходят.",
];

export const FAST_LOSS_ADVICE = [
  "Теряешь больше 1% массы тела в неделю стабильно? Немного добавь еды (особенно белка), чтобы сохранить мышцы.",
  "Слишком быстрый сброс грозит потерей мышц, упадком сил и срывами — марафон, а не спринт.",
  "Следи за самочувствием: головокружение, постоянная усталость и зябкость — сигнал есть больше.",
];

/** Простой прогноз даты достижения цели по фактическому темпу (кг/нед). */
export function forecastGoalDate(
  currentWeight: number,
  weeklyRate: number,
  goal = GOAL_WEIGHT,
  from: Date = new Date(),
): Date | null {
  if (weeklyRate <= 0 || currentWeight <= goal) return null;
  const weeksLeft = (currentWeight - goal) / weeklyRate;
  const d = new Date(from);
  d.setDate(d.getDate() + Math.round(weeksLeft * 7));
  return d;
}
