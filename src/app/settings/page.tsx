import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, LogOut } from "lucide-react";
import { getUser } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { FadeIn } from "@/components/ui/Motion";
import { SettingsForm } from "@/components/settings/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <div>
      <FadeIn>
        <div className="mb-4 mt-2 flex items-center gap-2">
          <Link href="/more" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <ChevronLeft size={20} />
          </Link>
        </div>
        <PageHeader title="Настройки" />
      </FadeIn>

      <FadeIn delay={0.05}>
        <SettingsForm
          user={{
            name: user.name,
            age: user.age,
            heightCm: user.heightCm,
            startWeight: user.startWeight,
            currentWeight: user.currentWeight,
            goalWeight: user.goalWeight,
            unit: user.unit,
            theme: user.theme,
          }}
        />
      </FadeIn>

      <FadeIn delay={0.1}>
        <form action="/api/auth/logout" method="post" className="mt-6">
          <button type="submit" className="btn-danger w-full">
            <LogOut size={18} /> Выйти из аккаунта
          </button>
        </form>
      </FadeIn>
      <div className="h-8" />
    </div>
  );
}
