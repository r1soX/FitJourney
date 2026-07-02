"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { Search, Star, ChevronRight, Dumbbell } from "lucide-react";
import { toggleFavorite } from "@/lib/actions";
import { cn } from "@/lib/utils";

export interface ExerciseLite {
  slug: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  category: string;
  isFavorite: boolean;
}

const GROUPS = ["Все", "ноги", "грудь", "спина", "плечи", "руки", "кор", "кардио"];

export function ExercisesBrowser({ exercises }: { exercises: ExerciseLite[] }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("Все");
  const [favOnly, setFavOnly] = useState(false);
  const [, start] = useTransition();
  const [favs, setFavs] = useState<Record<string, boolean>>(
    Object.fromEntries(exercises.map((e) => [e.slug, e.isFavorite])),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return exercises.filter((e) => {
      if (favOnly && !favs[e.slug]) return false;
      if (group !== "Все" && e.muscleGroup !== group) return false;
      if (q && !e.name.toLowerCase().includes(q) && !e.equipment.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [exercises, query, group, favOnly, favs]);

  function onToggleFav(slug: string) {
    setFavs((prev) => ({ ...prev, [slug]: !prev[slug] }));
    start(async () => {
      await toggleFavorite(slug).catch(() => {});
    });
  }

  return (
    <div>
      <div className="relative mb-3">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск упражнения..."
          className="input-field pl-11"
        />
      </div>

      <div className="-mx-4 mb-4 overflow-x-auto px-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFavOnly((f) => !f)}
            className={cn(
              "flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-all active:scale-95",
              favOnly
                ? "border-amber-400/40 bg-amber-400/15 text-amber-300"
                : "border-white/10 bg-white/[0.04] text-white/60",
            )}
          >
            <Star size={14} fill={favOnly ? "currentColor" : "none"} /> Избранное
          </button>
          {GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={cn(
                "h-9 shrink-0 rounded-full border px-3.5 text-sm font-medium capitalize transition-all active:scale-95",
                group === g
                  ? "border-accent/40 bg-accent/20 text-accent-soft"
                  : "border-white/10 bg-white/[0.04] text-white/60",
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-white/40">Ничего не найдено</p>
        )}
        {filtered.map((e) => (
          <div key={e.slug} className="glass flex items-center gap-2 p-3.5">
            <Link href={`/exercises/${e.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-accent-soft">
                <Dumbbell size={18} />
              </div>
              <div className="min-w-0">
                <div className="truncate font-medium">{e.name}</div>
                <div className="truncate text-xs text-white/40">
                  {e.muscleGroup} · {e.equipment}
                </div>
              </div>
            </Link>
            <button
              onClick={() => onToggleFav(e.slug)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white/30 active:scale-90"
            >
              <Star
                size={18}
                className={favs[e.slug] ? "text-amber-400" : ""}
                fill={favs[e.slug] ? "currentColor" : "none"}
              />
            </button>
            <Link href={`/exercises/${e.slug}`}>
              <ChevronRight size={16} className="text-white/25" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
