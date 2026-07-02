// Генератор годовой программы тренировок FitJourney.
// 3 тренировки в неделю (Пн/Ср/Пт), 52 недели, 6 фаз с безопасной прогрессией.
// Программа рассчитана на мужчину 26 лет, 185 см, старт 126 кг, цель 80 кг.
//
// ВАЖНО: используются только «незаметные» упражнения — тренажёры, гантели и блоки,
// работа стоя или сидя на одной станции. Без упражнений на полу и «толчковых» движений.

import { EXERCISE_BY_SLUG } from "./exercises";

export interface TplItem {
  slug: string;
  sets: number;
  reps: string;
  rest: number;
  block?: string; // main | superset-a | superset-b | finisher | core
  note?: string;
}

interface DayTpl {
  title: string;
  focus: string;
  items: TplItem[];
}

interface Phase {
  name: string;
  months: [number, number];
  intro: string;
  restAdvice: string;
  days: [DayTpl, DayTpl, DayTpl];
}

// ── Кардио по месяцам (минуты финишного кардио) — с акцентом на объём ──
const CARDIO_MIN: Record<number, number> = {
  1: 20, 2: 22, 3: 25, 4: 27, 5: 30, 6: 32,
  7: 34, 8: 36, 9: 38, 10: 40, 11: 42, 12: 45,
};

// Распределение недель по месяцам (сумма = 52)
const MONTH_WEEKS = [4, 4, 5, 4, 4, 5, 4, 4, 5, 4, 4, 5];

const WEEKDAYS = [1, 3, 5]; // Пн, Ср, Пт

// ─────────────────────────────────────────────
// Определения фаз (только незаметные упражнения)
// ─────────────────────────────────────────────
const PHASES: Phase[] = [
  {
    name: "Адаптация",
    months: [1, 2],
    intro:
      "Учимся технике и строим привычку на тренажёрах. Всё сидя или стоя на одной станции, умеренные веса, много повторов.",
    restAdvice:
      "Между тренировками — минимум 1 день отдыха. Сон 7–9 ч, вода 2.5–3 л. Не гонись за весами — гонись за техникой.",
    days: [
      {
        title: "Всё тело A",
        focus: "Освоение базовых движений",
        items: [
          { slug: "leg-press", sets: 3, reps: "12-15", rest: 75 },
          { slug: "machine-chest-press", sets: 3, reps: "12-15", rest: 75 },
          { slug: "lat-pulldown", sets: 3, reps: "12-15", rest: 75 },
          { slug: "leg-curl", sets: 3, reps: "12-15", rest: 60 },
          { slug: "machine-crunch", sets: 3, reps: "12-15", rest: 45, block: "core" },
        ],
      },
      {
        title: "Всё тело B",
        focus: "Ноги, спина и плечи",
        items: [
          { slug: "goblet-squat", sets: 3, reps: "12-15", rest: 75 },
          { slug: "seated-cable-row", sets: 3, reps: "12-15", rest: 75 },
          { slug: "machine-shoulder-press", sets: 3, reps: "12-15", rest: 75 },
          { slug: "romanian-deadlift-db", sets: 3, reps: "12", rest: 60 },
          { slug: "pallof-press", sets: 3, reps: "10/сторону", rest: 45, block: "core" },
        ],
      },
      {
        title: "Всё тело C",
        focus: "Объём и мышечный тонус",
        items: [
          { slug: "hack-squat", sets: 3, reps: "12-15", rest: 75 },
          { slug: "pec-deck", sets: 3, reps: "12-15", rest: 60 },
          { slug: "machine-row", sets: 3, reps: "12-15", rest: 75 },
          { slug: "calf-raise", sets: 3, reps: "15", rest: 45 },
          { slug: "cable-crunch", sets: 3, reps: "12", rest: 45, block: "core" },
        ],
      },
    ],
  },
  {
    name: "База",
    months: [3, 4],
    intro:
      "Вводим гантели (жим, тяга, наклон) наряду с тренажёрами. Повторов чуть меньше, техника — прежний приоритет.",
    restAdvice:
      "Держи 1 день отдыха между тренировками. Добавь 7–8 тыс. шагов в дни отдыха. Следи за белком в питании.",
    days: [
      {
        title: "Всё тело — Сила A",
        focus: "Присед, жим, тяга",
        items: [
          { slug: "goblet-squat", sets: 3, reps: "10-12", rest: 90 },
          { slug: "db-bench-press", sets: 3, reps: "10-12", rest: 90 },
          { slug: "lat-pulldown", sets: 3, reps: "10-12", rest: 75 },
          { slug: "romanian-deadlift-db", sets: 3, reps: "10-12", rest: 75 },
          { slug: "machine-crunch", sets: 3, reps: "15", rest: 45, block: "core" },
        ],
      },
      {
        title: "Всё тело — Сила B",
        focus: "Ноги и плечи",
        items: [
          { slug: "leg-press", sets: 3, reps: "10-12", rest: 90 },
          { slug: "overhead-db-press", sets: 3, reps: "10-12", rest: 75 },
          { slug: "seated-cable-row", sets: 3, reps: "10-12", rest: 75 },
          { slug: "leg-extension", sets: 3, reps: "12", rest: 60 },
          { slug: "pallof-press", sets: 3, reps: "10/сторону", rest: 45, block: "core" },
        ],
      },
      {
        title: "Всё тело — Сила C",
        focus: "Грудь, спина, руки",
        items: [
          { slug: "hack-squat", sets: 3, reps: "10-12", rest: 90 },
          { slug: "incline-db-press", sets: 3, reps: "10-12", rest: 75 },
          { slug: "db-row", sets: 3, reps: "10-12", rest: 75 },
          { slug: "db-curl", sets: 3, reps: "12", rest: 45, block: "superset-a" },
          { slug: "triceps-pushdown", sets: 3, reps: "12", rest: 45, block: "superset-b" },
        ],
      },
    ],
  },
  {
    name: "Развитие",
    months: [5, 6],
    intro:
      "Сплит Верх / Низ / Всё тело. Появляются суперсеты и первые интервалы кардио. Растёт объём.",
    restAdvice:
      "Восстановление критично: сон и питание держат прогресс. Если суставы ноют — снизь вес, не пропускай разминку.",
    days: [
      {
        title: "Верх тела",
        focus: "Грудь, спина, плечи, руки",
        items: [
          { slug: "machine-chest-press", sets: 3, reps: "8-12", rest: 90 },
          { slug: "lat-pulldown", sets: 3, reps: "8-12", rest: 90 },
          { slug: "overhead-db-press", sets: 3, reps: "10-12", rest: 75 },
          { slug: "seated-cable-row", sets: 3, reps: "10-12", rest: 75 },
          { slug: "db-curl", sets: 3, reps: "12", rest: 45, block: "superset-a" },
          { slug: "triceps-pushdown", sets: 3, reps: "12", rest: 45, block: "superset-b" },
        ],
      },
      {
        title: "Низ тела",
        focus: "Ноги",
        items: [
          { slug: "goblet-squat", sets: 4, reps: "8-12", rest: 90 },
          { slug: "romanian-deadlift-db", sets: 3, reps: "10-12", rest: 90 },
          { slug: "leg-press", sets: 3, reps: "12", rest: 75 },
          { slug: "leg-curl", sets: 3, reps: "12", rest: 60 },
          { slug: "calf-raise", sets: 4, reps: "15", rest: 45 },
          { slug: "machine-crunch", sets: 3, reps: "15", rest: 45, block: "core" },
        ],
      },
      {
        title: "Всё тело + интервалы",
        focus: "Силовая база и жиросжигание",
        items: [
          { slug: "hack-squat", sets: 3, reps: "10", rest: 90 },
          { slug: "db-bench-press", sets: 3, reps: "10", rest: 90 },
          { slug: "db-row", sets: 3, reps: "10", rest: 75 },
          { slug: "lateral-raise", sets: 3, reps: "12-15", rest: 45 },
          { slug: "pallof-press", sets: 3, reps: "10/сторону", rest: 45, block: "core" },
        ],
      },
    ],
  },
  {
    name: "Сила и жиросжигание",
    months: [7, 8],
    intro:
      "Классический сплит Жим / Тяга / Ноги (Push-Pull-Legs). Больше базовых движений и рабочих весов.",
    restAdvice:
      "Пик нагрузки — держи режим сна. Разминочные подходы обязательны перед тяжёлыми упражнениями.",
    days: [
      {
        title: "Жим (грудь, плечи, трицепс)",
        focus: "Толкающие мышцы",
        items: [
          { slug: "db-bench-press", sets: 4, reps: "6-10", rest: 120 },
          { slug: "machine-chest-press", sets: 3, reps: "8-12", rest: 90 },
          { slug: "overhead-db-press", sets: 3, reps: "8-10", rest: 90 },
          { slug: "lateral-raise", sets: 3, reps: "12-15", rest: 45 },
          { slug: "triceps-pushdown", sets: 3, reps: "10-12", rest: 60 },
        ],
      },
      {
        title: "Тяга (спина, бицепс)",
        focus: "Тянущие мышцы",
        items: [
          { slug: "lat-pulldown", sets: 4, reps: "8-10", rest: 90 },
          { slug: "seated-cable-row", sets: 3, reps: "8-12", rest: 90 },
          { slug: "db-row", sets: 3, reps: "8-12", rest: 75 },
          { slug: "face-pull", sets: 3, reps: "15", rest: 45 },
          { slug: "db-curl", sets: 3, reps: "10-12", rest: 45, block: "superset-a" },
          { slug: "hammer-curl", sets: 3, reps: "10-12", rest: 45, block: "superset-b" },
        ],
      },
      {
        title: "Ноги",
        focus: "Квадрицепс, бицепс бедра",
        items: [
          { slug: "goblet-squat", sets: 4, reps: "8-10", rest: 120 },
          { slug: "leg-press", sets: 3, reps: "10-12", rest: 90 },
          { slug: "romanian-deadlift-db", sets: 3, reps: "8-10", rest: 90 },
          { slug: "leg-extension", sets: 3, reps: "12", rest: 45, block: "superset-a" },
          { slug: "leg-curl", sets: 3, reps: "12", rest: 45, block: "superset-b" },
          { slug: "calf-raise", sets: 4, reps: "15", rest: 45 },
        ],
      },
    ],
  },
  {
    name: "Интенсив",
    months: [9, 10],
    intro:
      "Push-Pull-Legs с повышенным объёмом и финишерами. Максимальный расход энергии при сохранении силы.",
    restAdvice:
      "Объём высокий — слушай тело. Разрешено заменить 1 тренировку в неделю на активное восстановление, если накопилась усталость.",
    days: [
      {
        title: "Жим — объём",
        focus: "Грудь, плечи, трицепс",
        items: [
          { slug: "db-bench-press", sets: 4, reps: "8-10", rest: 90 },
          { slug: "incline-db-press", sets: 3, reps: "10-12", rest: 90 },
          { slug: "machine-shoulder-press", sets: 3, reps: "8-12", rest: 75 },
          { slug: "lateral-raise", sets: 3, reps: "15", rest: 45 },
          { slug: "triceps-pushdown", sets: 3, reps: "12", rest: 45, block: "superset-a" },
          { slug: "bench-dips", sets: 2, reps: "макс", rest: 60, block: "finisher" },
        ],
      },
      {
        title: "Тяга — объём",
        focus: "Спина, задние дельты, бицепс",
        items: [
          { slug: "assisted-pull-up", sets: 4, reps: "8-10", rest: 90 },
          { slug: "seated-cable-row", sets: 4, reps: "8-12", rest: 90 },
          { slug: "straight-arm-pulldown", sets: 3, reps: "12", rest: 60 },
          { slug: "face-pull", sets: 3, reps: "15", rest: 45 },
          { slug: "cable-curl", sets: 3, reps: "12", rest: 45, block: "superset-a" },
          { slug: "hammer-curl", sets: 3, reps: "12", rest: 45, block: "superset-b" },
        ],
      },
      {
        title: "Ноги — объём",
        focus: "Ноги целиком",
        items: [
          { slug: "goblet-squat", sets: 4, reps: "8-10", rest: 120 },
          { slug: "hack-squat", sets: 3, reps: "10-12", rest: 90 },
          { slug: "leg-press", sets: 3, reps: "12-15", rest: 90 },
          { slug: "leg-curl", sets: 3, reps: "12", rest: 45 },
          { slug: "calf-raise", sets: 4, reps: "15-20", rest: 45 },
          { slug: "captains-chair-raise", sets: 3, reps: "12", rest: 45, block: "core" },
        ],
      },
    ],
  },
  {
    name: "Пик и поддержка",
    months: [11, 12],
    intro:
      "Финальный блок: удерживаем силу и мышцы, максимизируем жиросжигание. Push-Pull-Legs + кондиция.",
    restAdvice:
      "Ты близко к цели. Не срывай темп: питание и сон решают. После года — переходи на поддерживающий режим.",
    days: [
      {
        title: "Жим — финал",
        focus: "Грудь, плечи, трицепс",
        items: [
          { slug: "db-bench-press", sets: 4, reps: "8-10", rest: 90 },
          { slug: "machine-chest-press", sets: 3, reps: "10-12", rest: 75 },
          { slug: "overhead-db-press", sets: 4, reps: "8-10", rest: 90 },
          { slug: "lateral-raise", sets: 4, reps: "15", rest: 45 },
          { slug: "triceps-pushdown", sets: 3, reps: "12", rest: 45, block: "superset-a" },
          { slug: "bench-dips", sets: 2, reps: "макс", rest: 60, block: "finisher" },
        ],
      },
      {
        title: "Тяга — финал",
        focus: "Спина и бицепс",
        items: [
          { slug: "lat-pulldown", sets: 4, reps: "8-10", rest: 90 },
          { slug: "machine-row", sets: 4, reps: "10-12", rest: 90 },
          { slug: "db-row", sets: 3, reps: "10", rest: 75 },
          { slug: "face-pull", sets: 3, reps: "15", rest: 45 },
          { slug: "db-curl", sets: 3, reps: "12", rest: 45, block: "superset-a" },
          { slug: "cable-curl", sets: 3, reps: "12", rest: 45, block: "superset-b" },
        ],
      },
      {
        title: "Ноги — финал",
        focus: "Ноги, кондиция",
        items: [
          { slug: "goblet-squat", sets: 4, reps: "10", rest: 120 },
          { slug: "romanian-deadlift-db", sets: 4, reps: "8-10", rest: 90 },
          { slug: "leg-press", sets: 4, reps: "12", rest: 90 },
          { slug: "leg-extension", sets: 3, reps: "15", rest: 45, block: "superset-a" },
          { slug: "leg-curl", sets: 3, reps: "15", rest: 45, block: "superset-b" },
          { slug: "calf-raise", sets: 4, reps: "20", rest: 45 },
        ],
      },
    ],
  },
];

// ─────────────────────────────────────────────
// Вспомогательные функции
// ─────────────────────────────────────────────
function phaseForMonth(month: number): Phase {
  return PHASES.find((p) => month >= p.months[0] && month <= p.months[1]) ?? PHASES[0];
}

function weightAdviceFor(slug: string): string {
  const ex = EXERCISE_BY_SLUG[slug];
  if (!ex) return "рабочий вес";
  if (ex.category === "warmup" || ex.category === "cooldown") return "—";
  if (ex.category === "cardio") return "—";
  if (ex.equipment.includes("вес тела")) return "вес тела";
  if (ex.category === "core") return "вес тела / лёгкий";
  return "рабочий вес: 1–2 повтора в запасе";
}

// Ротация кардио-тренажёров по дням недели:
//   Пн (0) — беговая дорожка, Ср (1) — велотренажёр, Пт (2) — лестница/степпер.
function cardioFor(month: number, dayIndex: number, isDeload: boolean) {
  const base = CARDIO_MIN[month] ?? 25;
  const min = isDeload ? Math.max(12, Math.round(base * 0.6)) : base;

  // Интервалы вводим с 6-го месяца в среду (велотренажёр)
  if (dayIndex === 1 && month >= 6 && !isDeload) {
    const rounds = Math.max(5, Math.round(min / 3));
    return {
      slug: "cardio-intervals",
      minutes: min,
      summary: `Интервалы на велотренажёре: ${rounds} раундов (1 мин мощно / 2 мин легко) ≈ ${min} мин`,
      reps: `${rounds} раундов`,
    };
  }

  if (dayIndex === 0) {
    const incline = Math.min(12, 6 + Math.floor(month / 2));
    return {
      slug: "treadmill-incline-walk",
      minutes: min,
      summary: `Беговая дорожка: наклон ${incline}%, ${min} мин, пульс 60–70% max`,
      reps: `${min} мин`,
    };
  }
  if (dayIndex === 1) {
    return {
      slug: "stationary-bike",
      minutes: min,
      summary: `Велотренажёр: ${min} мин ровным темпом с умеренным сопротивлением`,
      reps: `${min} мин`,
    };
  }
  return {
    slug: "stair-climber",
    minutes: min,
    summary: `Лестница (степпер): ${min} мин ровным темпом, корпус прямой`,
    reps: `${min} мин`,
  };
}

function warmupFor(_phaseIndex: number) {
  return {
    slug: "treadmill-warmup",
    summary: "5 минут лёгкой ходьбы на дорожке — поднять пульс",
    reps: "5 мин",
  };
}

function cooldownFor(dayIndex: number) {
  const slug = dayIndex % 2 === 0 ? "static-stretch" : "cooldown-walk";
  const summary =
    slug === "static-stretch"
      ? "5 минут растяжки стоя основных мышц"
      : "5 минут спокойной ходьбы для восстановления";
  return { slug, summary, reps: "5 мин" };
}

// ─────────────────────────────────────────────
// Публичные типы результата
// ─────────────────────────────────────────────
export interface GenExerciseItem {
  slug: string;
  order: number;
  block: string;
  sets: number;
  reps: string;
  weightAdvice: string;
  restSeconds: number;
  note: string;
}

export interface GenPlan {
  sequence: number;
  month: number;
  weekOfProgram: number;
  weekOfMonth: number;
  dayOfWeek: number;
  phase: string;
  title: string;
  focus: string;
  warmup: string;
  cardio: string;
  cooldown: string;
  restAdvice: string;
  notes: string;
  estMinutes: number;
  isDeload: boolean;
  exercises: GenExerciseItem[];
}

// ─────────────────────────────────────────────
// Главный генератор
// ─────────────────────────────────────────────
export function generateProgram(): GenPlan[] {
  const plans: GenPlan[] = [];
  let sequence = 0;
  let week = 0;

  for (let month = 1; month <= 12; month++) {
    const weeksInMonth = MONTH_WEEKS[month - 1];
    const phase = phaseForMonth(month);
    const phaseIndex = PHASES.indexOf(phase);
    const monthWithinPhase = (month - phase.months[0]) % 2; // 0 = первый месяц блока, 1 = второй

    for (let wm = 1; wm <= weeksInMonth; wm++) {
      week++;
      const isDeload = week % 4 === 0; // каждая 4-я неделя — разгрузочная

      for (let dayIndex = 0; dayIndex < 3; dayIndex++) {
        sequence++;
        const day = phase.days[dayIndex];
        const warmup = warmupFor(phaseIndex);
        const cardio = cardioFor(month, dayIndex, isDeload);
        const cooldown = cooldownFor(dayIndex);

        // Заметка по прогрессии
        let notes: string;
        if (isDeload) {
          notes =
            "🌿 Разгрузочная неделя: снизь рабочие веса на 30–40%, меньше подходов, акцент на технике и восстановлении. Это часть плана, а не слабость.";
        } else if (monthWithinPhase === 1) {
          notes =
            "📈 Второй месяц блока: где выполняешь верх диапазона повторов во всех подходах — добавь небольшой вес на следующей тренировке.";
        } else {
          notes =
            "Держи идеальную технику. Прогрессируй в весе, когда все подходы даются с запасом 1–2 повтора.";
        }

        // Формируем список: разминка → силовые/кор → кардио → заминка
        const items: GenExerciseItem[] = [];
        let order = 0;

        items.push({
          slug: warmup.slug,
          order: order++,
          block: "warmup",
          sets: 1,
          reps: warmup.reps,
          weightAdvice: "—",
          restSeconds: 0,
          note: warmup.summary,
        });

        for (const it of day.items) {
          // Прогрессия объёма: во втором месяце блока +1 подход на первых двух базовых
          let sets = it.sets;
          if (monthWithinPhase === 1 && !isDeload && order <= 2 && (it.block ?? "main") === "main") {
            sets += 1;
          }
          if (isDeload) {
            sets = Math.max(2, sets - 1);
          }
          items.push({
            slug: it.slug,
            order: order++,
            block: it.block ?? "main",
            sets,
            reps: it.reps,
            weightAdvice: weightAdviceFor(it.slug),
            restSeconds: it.rest,
            note: it.note ?? "",
          });
        }

        items.push({
          slug: cardio.slug,
          order: order++,
          block: "cardio",
          sets: 1,
          reps: cardio.reps,
          weightAdvice: "—",
          restSeconds: 60,
          note: cardio.summary,
        });

        items.push({
          slug: cooldown.slug,
          order: order++,
          block: "cooldown",
          sets: 1,
          reps: cooldown.reps,
          weightAdvice: "—",
          restSeconds: 0,
          note: cooldown.summary,
        });

        const strengthSets = day.items.reduce((s, i) => s + i.sets, 0);
        const estMinutes = Math.round(10 + strengthSets * 2.4 + cardio.minutes);

        plans.push({
          sequence,
          month,
          weekOfProgram: week,
          weekOfMonth: wm,
          dayOfWeek: WEEKDAYS[dayIndex],
          phase: phase.name,
          title: day.title,
          focus: day.focus,
          warmup: warmup.summary,
          cardio: cardio.summary,
          cooldown: cooldown.summary,
          restAdvice: phase.restAdvice,
          notes,
          estMinutes,
          isDeload,
          exercises: items,
        });
      }
    }
  }

  return plans;
}

export const PHASE_INFO = PHASES.map((p) => ({
  name: p.name,
  months: p.months,
  intro: p.intro,
}));
