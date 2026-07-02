"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { toggleFavorite } from "@/lib/actions";

export function FavoriteToggle({ slug, initial }: { slug: string; initial: boolean }) {
  const [fav, setFav] = useState(initial);
  const [, start] = useTransition();

  return (
    <button
      onClick={() => {
        setFav((f) => !f);
        start(async () => {
          await toggleFavorite(slug).catch(() => {});
        });
      }}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 active:scale-90"
      aria-label="В избранное"
    >
      <Star size={20} className={fav ? "text-amber-400" : "text-white/40"} fill={fav ? "currentColor" : "none"} />
    </button>
  );
}
