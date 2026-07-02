// Модель годового графика похудения FitJourney: 126 → 80 кг за 12 месяцев.
// Кривая слегка «фронт-загружена»: в начале при большой массе вес уходит быстрее,
// ближе к цели темп естественно замедляется — это безопасно и физиологично.

export const START_WEIGHT = 126;
export const GOAL_WEIGHT = 80;
export const TOTAL_LOSS = START_WEIGHT - GOAL_WEIGHT; // 46 кг
export const PROGRAM_DAYS = 365;

/** Доля пройденного пути (0..1) с фронт-загрузкой. */
function lossFraction(t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - clamped, 1.25);
}

/** Целевой вес на момент t (0 = старт, 1 = год). */
export function targetWeightAtProgress(t: number): number {
  return START_WEIGHT - TOTAL_LOSS * lossFraction(t);
}

/** Целевой вес на дату относительно старта программы. */
export function targetWeightForDate(startDate: Date, date: Date): number {
  const days = (date.getTime() - startDate.getTime()) / 86_400_000;
  const t = days / PROGRAM_DAYS;
  return targetWeightAtProgress(t);
}

export interface Milestone {
  month: number;
  targetWeight: number;
  lostByThen: number;
  label: string;
}

/** Контрольные точки по месяцам (целевой вес на конец месяца). */
export function monthlyMilestones(): Milestone[] {
  const list: Milestone[] = [];
  for (let m = 1; m <= 12; m++) {
    const w = Math.round(targetWeightAtProgress(m / 12) * 10) / 10;
    list.push({
      month: m,
      targetWeight: w,
      lostByThen: Math.round((START_WEIGHT - w) * 10) / 10,
      label: `Месяц ${m}`,
    });
  }
  // Гарантируем ровную цель в финале
  list[11].targetWeight = GOAL_WEIGHT;
  list[11].lostByThen = TOTAL_LOSS;
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
  from: Date = new Date(),
): Date | null {
  if (weeklyRate <= 0 || currentWeight <= GOAL_WEIGHT) return null;
  const weeksLeft = (currentWeight - GOAL_WEIGHT) / weeklyRate;
  const d = new Date(from);
  d.setDate(d.getDate() + Math.round(weeksLeft * 7));
  return d;
}
