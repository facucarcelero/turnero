import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/actions/guard";
import { HorariosClient } from "./horarios-client";

export const dynamic = "force-dynamic";

export default async function HorariosPage() {
  const currentUser = await getCurrentAdmin();
  const scopeToOwn = currentUser?.role === "STAFF" ? currentUser.professionalId : null;

  const professionals = await prisma.professional.findMany({
    where: { active: true, ...(scopeToOwn ? { id: scopeToOwn } : {}) },
    include: { workingHours: true },
    orderBy: { order: "asc" },
  });

  return (
    <HorariosClient
      professionals={professionals.map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        workingHours: p.workingHours.map((w) => ({ weekday: w.weekday, startTime: w.startTime, endTime: w.endTime })),
      }))}
    />
  );
}
