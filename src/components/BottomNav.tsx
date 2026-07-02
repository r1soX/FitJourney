"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Dumbbell, CalendarDays, Scale, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/program", label: "План", icon: Dumbbell },
  { href: "/calendar", label: "Календарь", icon: CalendarDays },
  { href: "/weight", label: "Вес", icon: Scale },
  { href: "/more", label: "Ещё", icon: LayoutGrid },
];

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="glass-nav fixed inset-x-0 bottom-0 z-40 safe-bottom">
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-2">
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className="relative flex flex-col items-center gap-1 py-1.5"
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute -top-0.5 h-1 w-8 rounded-full bg-accent shadow-glow"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  size={22}
                  strokeWidth={active ? 2.4 : 1.9}
                  className={cn(
                    "transition-colors",
                    active ? "text-accent-soft" : "text-white/45",
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium transition-colors",
                    active ? "text-white" : "text-white/45",
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
