// Серверные помощники авторизации (используют cookies и Prisma).
import "server-only";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  encodeSession,
  decodeSession,
  type SessionPayload,
} from "./session";

/** Проверка логина/пароля по данным пользователя из БД. */
export async function verifyCredentials(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  return ok ? user : null;
}

/** Создать сессию и установить cookie. */
export async function createSession(payload: SessionPayload) {
  const token = await encodeSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/** Удалить сессию (выход). */
export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Текущая сессия из cookie или null. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return decodeSession(store.get(SESSION_COOKIE)?.value);
}

/** Требует авторизацию: возвращает пользователя или бросает (маршруты защищены middleware). */
export async function requireUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.uid } });
}
