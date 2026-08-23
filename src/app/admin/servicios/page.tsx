import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/actions/guard";
import { ServiciosClient } from "./servicios-client";

export const dynamic = "force-dynamic";

export default async function ServiciosPage() {
  await requirePageRole("ADMIN");

  const [services, professionals] = await Promise.all([
    prisma.service.findMany({
      include: { professionals: true, _count: { select: { appointments: true } } },
      orderBy: { order: "asc" },
    }),
    prisma.professional.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <ServiciosClient
      services={services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        durationMin: s.durationMin,
        price: s.price,
        color: s.color,
        active: s.active,
        professionalIds: s.professionals.map((p) => p.id),
        appointmentsCount: s._count.appointments,
      }))}
      professionals={professionals.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}
