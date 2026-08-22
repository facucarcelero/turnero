import { prisma } from "@/lib/prisma";
import { ProfesionalesClient } from "./profesionales-client";

export const dynamic = "force-dynamic";

export default async function ProfesionalesPage() {
  const professionals = await prisma.professional.findMany({
    include: { _count: { select: { appointments: true } } },
    orderBy: { order: "asc" },
  });

  return (
    <ProfesionalesClient
      professionals={professionals.map((p) => ({
        id: p.id,
        name: p.name,
        specialty: p.specialty,
        bio: p.bio,
        color: p.color,
        active: p.active,
        appointmentsCount: p._count.appointments,
      }))}
    />
  );
}
