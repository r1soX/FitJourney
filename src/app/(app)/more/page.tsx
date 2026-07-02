import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  History,
  BookOpen,
  Award,
  Settings,
  LogOut,
  ChevronRight,
  HeartPulse,
} from "lucide-react";
import { getUser } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { FadeIn } from "@/components/ui/Motion";

export const dynamic = "force-dynamic";

const ITEMS = [
  { href: "/stats", label: "Статистика", desc: "Прогресс в цифрах", icon: BarChart3 },
  { href: "/history", label: "История", desc: "Все тренировки", icon: History },
  { href: "/exercises", label: "Упражнения", desc: "Библиотека и техника", icon: BookOpen },
  { href: "/achievements", label: "Достижения", desc: "Награды и серии", icon: Award },
  { href: "/plan-info", label: "О программе", desc: "Фазы и график похудения", icon: HeartPulse },
  { href: "/settings", label: "Настройки", desc: "Профиль, вес, цель, данные", icon: Settings },
];

export default async function MorePage() {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <div>
      <FadeIn>
        <PageHeader title="Ещё" subtitle={user.name} />
      </FadeIn>

      <div className="space-y-2">
        {ITEMS.map((it, i) => {
          const Icon = it.icon;
          return (
            <FadeIn key={it.href} delay={Math.min(i * 0.04, 0.3)}>
              <Link href={it.href} className="glass flex items-center gap-4 p-4 active:scale-[0.98]">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-accent-soft">
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{it.label}</div>
                  <div className="text-xs text-white/40">{it.desc}</div>
                </div>
                <ChevronRight size={18} className="text-white/25" />
              </Link>
            </FadeIn>
          );
        })}
      </div>

      <FadeIn delay={0.3}>
        <form action="/api/auth/logout" method="post" className="mt-6">
          <button type="submit" className="btn-danger w-full">
            <LogOut size={18} /> Выйти из аккаунта
          </button>
        </form>
      </FadeIn>

      <p className="mt-6 text-center text-xs text-white/25">FitJourney · v1.0</p>
      <div className="h-4" />
    </div>
  );
}
