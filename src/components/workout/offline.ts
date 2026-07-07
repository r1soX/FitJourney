// Офлайн-очередь завершения тренировок.
// Если при завершении нет сети, полезная нагрузка кладётся в localStorage и
// дозаписывается автоматически при восстановлении соединения (см. PendingSync).

export interface FinishPayload {
  logs: { id: number; status: string; setsData: unknown }[];
  notes?: string;
  feelings?: string;
  difficulty?: number | null;
  mood?: number | null;
  pain?: number | null;
  durationSec?: number;
}

const PENDING_KEY = "fj_pending_finish";

export function storageKey(sessionId: number) {
  return `fj_workout_${sessionId}`;
}

export function saveProgress(
  sessionId: number,
  state: { logs: unknown; index: number },
) {
  try {
    localStorage.setItem(storageKey(sessionId), JSON.stringify(state));
  } catch {
    /* хранилище недоступно — игнорируем */
  }
}

export function loadProgress(
  sessionId: number,
): { logs: unknown; index: number } | null {
  try {
    const raw = localStorage.getItem(storageKey(sessionId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearProgress(sessionId: number) {
  try {
    localStorage.removeItem(storageKey(sessionId));
  } catch {
    /* ignore */
  }
}

interface PendingItem {
  sessionId: number;
  payload: FinishPayload;
}

export function queuePendingFinish(sessionId: number, payload: FinishPayload) {
  try {
    const arr: PendingItem[] = JSON.parse(localStorage.getItem(PENDING_KEY) || "[]");
    // не дублируем одну и ту же сессию
    const filtered = arr.filter((x) => x.sessionId !== sessionId);
    filtered.push({ sessionId, payload });
    localStorage.setItem(PENDING_KEY, JSON.stringify(filtered));
  } catch {
    /* ignore */
  }
}

export function readPending(): PendingItem[] {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) || "[]");
  } catch {
    return [];
  }
}

export function writePending(items: PendingItem[]) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}
