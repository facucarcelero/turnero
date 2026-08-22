import { prisma } from "@/lib/prisma";
import { AgendaClient } from "./agenda-client";
import { addDaysStr, todayStr } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const from = addDaysStr(todayStr(), -30);
  const to = addDaysStr(todayStr(), 120);

  const [professionals, appointments, blockedSlots, services, patients] = await Promise.all([
    prisma.professional.findMany({
      where: { active: true },
      include: { workingHours: true },
      orderBy: { order: "asc" },
    }),
    prisma.appointment.findMany({
      where: { date: { gte: from, lte: to } },
      include: { patient: true, service: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.blockedSlot.findMany({ where: { date: { gte: from, lte: to } } }),
    prisma.service.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
    prisma.patient.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <AgendaClient
      professionals={professionals.map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        workingHours: p.workingHours.map((w) => ({ weekday: w.weekday, startTime: w.startTime, endTime: w.endTime })),
      }))}
      appointments={appointments.map((a) => ({
        id: a.id,
        date: a.date,
        startTime: a.startTime,
        endTime: a.endTime,
        status: a.status,
        notes: a.notes,
        professionalId: a.professionalId,
        patientId: a.patientId,
        patientName: `${a.patient.firstName} ${a.patient.lastName}`,
        patientPhone: a.patient.phone,
        serviceId: a.serviceId,
        serviceName: a.service.name,
      }))}
      blockedSlots={blockedSlots.map((b) => ({
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
        reason: b.reason,
        professionalId: b.professionalId,
      }))}
      services={services.map((s) => ({ id: s.id, name: s.name, durationMin: s.durationMin }))}
      patients={patients.map((p) => ({ id: p.id, firstName: p.firstName, lastName: p.lastName, phone: p.phone, dni: p.dni }))}
    />
  );
}
