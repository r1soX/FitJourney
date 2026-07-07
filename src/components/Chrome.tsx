"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { PendingSync } from "@/components/workout/PendingSync";

// Общая «обёртка» интерфейса: контейнер + нижняя навигация для всех страниц,
// кроме экрана входа. Заменяет прежний layout route-группы (app) — без скобок в URL.
export function Chrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-md">
      <main className="px-4 pt-safe pb-safe-nav">{children}</main>
      <BottomNav />
      <PWAInstallPrompt />
      <PendingSync />
    </div>
  );
}
