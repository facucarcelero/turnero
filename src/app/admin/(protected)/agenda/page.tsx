import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/actions/guard";
import { AgendaClient } from "./agenda-client";
import { addDaysStr, todayStr } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const from = addDaysStr(todayStr(), -30);
  const to = addDaysStr(todayStr(), 120);
  const currentUser = await getCurrentAdmin();
  // Un profesional con usuario autogestionado sólo ve su propia agenda.
  const scopeToOwn = currentUser?.role === "STAFF" ? currentUser.professionalId : null;

  const [professionals, appointments, blockedSlots, services, combos, patients, insuranceProviders] = await Promise.all([
    prisma.professional.findMany({
      where: { active: true, ...(scopeToOwn ? { id: scopeToOwn } : {}) },
      include: { workingHours: true },
      orderBy: { order: "asc" },
    }),
    prisma.appointment.findMany({
      where: { date: { gte: from, lte: to }, ...(scopeToOwn ? { professionalId: scopeToOwn } : {}) },
      include: { patient: true, service: true, extraServices: true, insuranceProvider: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.blockedSlot.findMany({
      where: {
        date: { gte: from, lte: to },
        ...(scopeToOwn ? { OR: [{ professionalId: scopeToOwn }, { professionalId: null }] } : {}),
      },
    }),
    prisma.service.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
    prisma.serviceCombo.findMany({ where: { active: true }, include: { services: { select: { id: true } } }, orderBy: { order: "asc" } }),
    prisma.patient.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.insuranceProvider.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
  ]);

  return (
    <AgendaClient
      professionals={professionals.map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        workingHours: p.workingHours.map((w) => ({ weekday: w.weekday, startTime: w.startTime, endTime: w.endTime })),
      }))}
      appointments={appointments.map((a) => {
        const allServices = [a.service, ...a.extraServices];
        return {
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
          serviceIds: allServices.map((s) => s.id),
          serviceName: allServices.map((s) => s.name).join(" + "),
          insuranceProviderId: a.insuranceProviderId,
          insuranceProviderName: a.insuranceProvider?.name ?? null,
          insuranceMemberNumber: a.insuranceMemberNumber,
          copaymentAmount: a.copaymentAmount,
        };
      })}
      blockedSlots={blockedSlots.map((b) => ({
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
        reason: b.reason,
        professionalId: b.professionalId,
      }))}
      services={services.map((s) => ({ id: s.id, name: s.name, durationMin: s.durationMin, price: s.price }))}
      combos={combos.map((c) => ({ id: c.id, name: c.name, price: c.price, durationMin: c.durationMin, serviceIds: c.services.map((s) => s.id) }))}
      patients={patients.map((p) => ({ id: p.id, firstName: p.firstName, lastName: p.lastName, phone: p.phone, dni: p.dni }))}
      insuranceProviders={insuranceProviders.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}
