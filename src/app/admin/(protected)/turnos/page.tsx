import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/actions/guard";
import { TurnosClient } from "./turnos-client";

export const dynamic = "force-dynamic";

export default async function TurnosPage() {
  const currentUser = await getCurrentAdmin();
  const scopeToOwn = currentUser?.role === "STAFF" ? currentUser.professionalId : null;

  const [appointments, professionals, services, patients] = await Promise.all([
    prisma.appointment.findMany({
      where: scopeToOwn ? { professionalId: scopeToOwn } : undefined,
      include: { patient: true, service: true, professional: true },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
      take: 500,
    }),
    prisma.professional.findMany({
      where: scopeToOwn ? { id: scopeToOwn } : undefined,
      orderBy: { order: "asc" },
    }),
    prisma.service.findMany({ orderBy: { order: "asc" } }),
    prisma.patient.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <TurnosClient
      appointments={appointments.map((a) => ({
        id: a.id,
        date: a.date,
        startTime: a.startTime,
        endTime: a.endTime,
        status: a.status,
        notes: a.notes,
        patientId: a.patientId,
        patientName: `${a.patient.firstName} ${a.patient.lastName}`,
        patientPhone: a.patient.phone,
        professionalId: a.professionalId,
        professionalName: a.professional.name,
        serviceId: a.serviceId,
        serviceName: a.service.name,
        servicePrice: a.service.price,
      }))}
      professionals={professionals.map((p) => ({ id: p.id, name: p.name }))}
      services={services.map((s) => ({ id: s.id, name: s.name, durationMin: s.durationMin }))}
      patients={patients.map((p) => ({ id: p.id, firstName: p.firstName, lastName: p.lastName, phone: p.phone, dni: p.dni }))}
    />
  );
}
