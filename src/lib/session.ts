// Edge-совместимая работа с JWT-сессией (используется в т.ч. в middleware).
import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "fitjourney-dev-secret-change-me",
);

export const SESSION_COOKIE = "fj_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 год — сессия не сбрасывается

export interface SessionPayload {
  uid: number;
  username: string;
}

export async function encodeSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(SECRET);
}

export async function decodeSession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (typeof payload.uid === "number" && typeof payload.username === "string") {
      return { uid: payload.uid, username: payload.username };
    }
    return null;
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = MAX_AGE_SECONDS;
