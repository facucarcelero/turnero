import { prisma } from "@/lib/prisma";
import { PacientesClient } from "./pacientes-client";

export const dynamic = "force-dynamic";

export default async function PacientesPage() {
  const patients = await prisma.patient.findMany({
    include: { _count: { select: { appointments: true } } },
    orderBy: { createdAt: "desc" },
  });

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
        appointmentsCount: p._count.appointments,
      }))}
    />
  );
}
