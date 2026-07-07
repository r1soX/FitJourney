// Показывает все тренировки-сессии в базе (диагностика).
// Запуск из корня проекта:  node scripts/list-sessions.mjs

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const users = await prisma.user.findMany();
for (const u of users) {
  const sessions = await prisma.workoutSession.findMany({
    where: { userId: u.id },
    orderBy: { date: "asc" },
    include: { plan: { select: { sequence: true, title: true } } },
  });
  const completed = sessions.filter((s) => s.status === "completed");
  const totalSec = completed.reduce((a, s) => a + (s.durationSec ?? 0), 0);
  console.log(`\n=== ${u.username} === завершённых: ${completed.length}, всего сессий: ${sessions.length}, часов: ${(totalSec / 3600).toFixed(1)}`);
  for (const s of sessions) {
    const min = Math.round((s.durationSec ?? 0) / 60);
    console.log(
      `  #${s.id} seq${s.plan?.sequence ?? "—"} «${s.plan?.title ?? "?"}» | ${s.status} | ${min} мин | ${s.date.toISOString().slice(0, 10)} | notes: ${s.notes || "—"}`,
    );
  }
}
await prisma.$disconnect();
