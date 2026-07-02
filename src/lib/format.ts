// Утилиты форматирования (даты, вес, длительность) — на русском.

const KG_TO_LB = 2.2046226218;

export function toDisplayWeight(kg: number, unit: string): number {
  return unit === "lb" ? kg * KG_TO_LB : kg;
}

export function fromDisplayWeight(value: number, unit: string): number {
  return unit === "lb" ? value / KG_TO_LB : value;
}

export function formatWeight(kg: number, unit: string, digits = 1): string {
  const v = toDisplayWeight(kg, unit);
  return `${v.toFixed(digits)} ${unit === "lb" ? "фунт" : "кг"}`;
}

export function unitLabel(unit: string): string {
  return unit === "lb" ? "фунт" : "кг";
}

const MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
const MONTHS_SHORT = [
  "янв", "фев", "мар", "апр", "май", "июн",
  "июл", "авг", "сен", "окт", "ноя", "дек",
];
const WEEKDAYS_SHORT = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const WEEKDAYS_FULL = [
  "Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота",
];

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function formatDateFull(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateShort(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

export function weekdayShort(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return WEEKDAYS_SHORT[date.getDay()];
}

export function weekdayFull(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return WEEKDAYS_FULL[date.getDay()];
}

export function weekdayFromNumber(n: number): string {
  // 1 = Пн ... 7 = Вс
  return WEEKDAYS_FULL[n % 7];
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h} ч ${m} мин`;
  if (m > 0) return `${m} мин${s > 0 ? ` ${s} с` : ""}`;
  return `${s} с`;
}

export function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function relativeDay(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return "Сегодня";
  if (diff === 1) return "Завтра";
  if (diff === -1) return "Вчера";
  if (diff > 1 && diff < 7) return `Через ${diff} дн.`;
  if (diff < -1 && diff > -7) return `${Math.abs(diff)} дн. назад`;
  return formatDate(date);
}

export function pluralize(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
