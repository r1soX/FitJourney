import { redirect } from "next/navigation";
import { getUser, getAllPlansWithMeta } from "@/lib/data";
import { PHASE_INFO } from "@/lib/program/generator";
import { formatDateShort } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { FadeIn } from "@/components/ui/Motion";
import { ProgramBrowser, type PlanLite } from "@/components/ProgramBrowser";

export const dynamic = "force-dynamic";

export default async function ProgramPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const plans = await getAllPlansWithMeta(user.programStartDate, user.id);
  const lite: PlanLite[] = plans.map((p) => ({
    id: p.id,
    sequence: p.sequence,
    month: p.month,
    weekOfProgram: p.weekOfProgram,
    weekOfMonth: p.weekOfMonth,
    dayOfWeek: p.dayOfWeek,
    phase: p.phase,
    title: p.title,
    focus: p.focus,
    estMinutes: p.estMinutes,
    isDeload: p.isDeload,
    dateLabel: formatDateShort(p.date),
    weekdayLabel: "",
    status: p.status,
  }));

  const currentMonth =
    plans.find((p) => p.status === "today" || p.status === "upcoming")?.month ?? 1;

  return (
    <div>
      <FadeIn>
        <PageHeader
          title="Программа"
          subtitle="Годовой план · 3 тренировки в неделю"
        />
      </FadeIn>
      <ProgramBrowser plans={lite} phases={PHASE_INFO} initialMonth={currentMonth} />
      <div className="h-4" />
    </div>
  );
}
