import { prisma } from "@/lib/prisma";
import { BloqueosClient } from "./bloqueos-client";
import { todayStr } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function BloqueosPage() {
  const [blockedSlots, professionals] = await Promise.all([
    prisma.blockedSlot.findMany({
      where: { date: { gte: todayStr() } },
      include: { professional: true },
      orderBy: { date: "asc" },
    }),
    prisma.professional.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
  ]);

  return (
    <BloqueosClient
      blockedSlots={blockedSlots.map((b) => ({
        id: b.id,
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
        reason: b.reason,
        professionalId: b.professionalId,
        professionalName: b.professional?.name ?? null,
      }))}
      professionals={professionals.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}
