import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { BottomNav } from "@/components/BottomNav";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { PendingSync } from "@/components/workout/PendingSync";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-md">
      <main className="px-4 pt-safe pb-safe-nav">{children}</main>
      <BottomNav />
      <PWAInstallPrompt />
      <PendingSync />
    </div>
  );
}
