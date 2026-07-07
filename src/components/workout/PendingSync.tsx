"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { completeWorkout } from "@/lib/actions";
import { readPending, writePending } from "./offline";

// Дозаписывает завершённые в офлайне тренировки при появлении сети.
export function PendingSync() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function flush() {
      const items = readPending();
      if (items.length === 0) return;
      const remaining: typeof items = [];
      let anySuccess = false;
      for (const it of items) {
        try {
          await completeWorkout(it.sessionId, it.payload);
          anySuccess = true;
        } catch {
          remaining.push(it);
        }
      }
      if (cancelled) return;
      writePending(remaining);
      if (anySuccess) router.refresh();
    }

    flush();
    const onOnline = () => flush();
    window.addEventListener("online", onOnline);
    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
    };
  }, [router]);

  return null;
}
