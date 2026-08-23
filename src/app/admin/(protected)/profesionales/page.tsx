import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/actions/guard";
import { ProfesionalesClient } from "./profesionales-client";

export const dynamic = "force-dynamic";

export default async function ProfesionalesPage() {
  await requirePageRole("ADMIN");

  const [professionals, insuranceProviders] = await Promise.all([
    prisma.professional.findMany({
      include: { _count: { select: { appointments: true } }, insuranceProviders: true },
      orderBy: { order: "asc" },
    }),
    prisma.insuranceProvider.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
  ]);

  return (
    <ProfesionalesClient
      professionals={professionals.map((p) => ({
        id: p.id,
        name: p.name,
        specialty: p.specialty,
        bio: p.bio,
        color: p.color,
        active: p.active,
        asksInsurance: p.asksInsurance,
        insuranceProviderIds: p.insuranceProviders.map((ip) => ip.id),
        appointmentsCount: p._count.appointments,
      }))}
      insuranceProviders={insuranceProviders.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}
