import { redirect } from "next/navigation";
import { getUser, getAllPlansWithMeta } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { unitLabel } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { FadeIn } from "@/components/ui/Motion";
import { CalendarView, type CalEvent, type CalWeight } from "@/components/CalendarView";

export const dynamic = "force-dynamic";

function keyOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export default async function CalendarPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const plans = await getAllPlansWithMeta(user.programStartDate, user.id);
  const entries = await prisma.weightEntry.findMany({
    where: { userId: user.id },
    orderBy: { date: "asc" },
  });

  const events: CalEvent[] = plans.map((p) => ({
    dateISO: keyOf(p.date),
    status: p.status,
    sequence: p.sequence,
    title: p.title,
  }));
  const weights: CalWeight[] = entries.map((e) => ({
    dateISO: keyOf(e.date),
    weight: e.weight,
  }));

  const now = new Date();

  return (
    <div>
      <FadeIn>
        <PageHeader title="Календарь" subtitle="Тренировки и замеры веса" />
      </FadeIn>
      <FadeIn delay={0.05}>
        <CalendarView
          events={events}
          weights={weights}
          initialYear={now.getFullYear()}
          initialMonth={now.getMonth()}
          unitLabel={unitLabel(user.unit)}
        />
      </FadeIn>
      <div className="h-4" />
    </div>
  );
}
