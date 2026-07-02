import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, decodeSession } from "@/lib/session";

// Публичные пути, не требующие авторизации
const PUBLIC_PATHS = ["/login", "/api/auth/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await decodeSession(token);

  // Авторизован и идёт на /login → на главную
  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Не авторизован и путь защищён → на /login
  if (!session && !isPublic) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Исключаем статику, картинки, PWA-файлы
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons|images|apple-touch-icon.png|robots.txt).*)",
  ],
};
