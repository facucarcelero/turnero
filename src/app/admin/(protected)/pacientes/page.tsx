import { prisma } from "@/lib/prisma";
import { PacientesClient } from "./pacientes-client";

export const dynamic = "force-dynamic";

export default async function PacientesPage() {
  const [patients, insuranceProviders] = await Promise.all([
    prisma.patient.findMany({
      include: { _count: { select: { appointments: true } }, insuranceProvider: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.insuranceProvider.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
  ]);

  return (
    <PacientesClient
      patients={patients.map((p) => ({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        phone: p.phone,
        email: p.email,
        dni: p.dni,
        birthDate: p.birthDate,
        notes: p.notes,
        insuranceProviderId: p.insuranceProviderId,
        insuranceMemberNumber: p.insuranceMemberNumber,
        insuranceProviderName: p.insuranceProvider?.name ?? null,
        appointmentsCount: p._count.appointments,
      }))}
      insuranceProviders={insuranceProviders.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}
