"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play, Loader2 } from "lucide-react";
import { startWorkout } from "@/lib/actions";
import { cn } from "@/lib/utils";

export function StartWorkoutButton({
  planId,
  label = "Начать тренировку",
  className,
  variant = "primary",
}: {
  planId: number;
  label?: string;
  className?: string;
  variant?: "primary" | "ghost";
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [loading, setLoading] = useState(false);

  function go() {
    setLoading(true);
    start(async () => {
      try {
        const sessionId = await startWorkout(planId);
        router.push(`/workout/${sessionId}`);
      } catch {
        setLoading(false);
      }
    });
  }

  const busy = pending || loading;

  return (
    <button
      onClick={go}
      disabled={busy}
      className={cn(variant === "primary" ? "btn-primary" : "btn-ghost", className)}
    >
      {busy ? (
        <Loader2 size={20} className="animate-spin" />
      ) : (
        <Play size={20} fill="currentColor" />
      )}
      {label}
    </button>
  );
}
