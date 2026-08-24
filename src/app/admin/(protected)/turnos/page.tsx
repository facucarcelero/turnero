import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/actions/guard";
import { computeTotals } from "@/lib/combo-totals";
import { TurnosClient } from "./turnos-client";

export const dynamic = "force-dynamic";

export default async function TurnosPage() {
  const currentUser = await getCurrentAdmin();
  const scopeToOwn = currentUser?.role === "STAFF" ? currentUser.professionalId : null;

  const [appointments, professionals, services, combos, patients, insuranceProviders] = await Promise.all([
    prisma.appointment.findMany({
      where: scopeToOwn ? { professionalId: scopeToOwn } : undefined,
      include: { patient: true, service: true, extraServices: true, combo: true, professional: true, insuranceProvider: true },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
      take: 500,
    }),
    prisma.professional.findMany({
      where: scopeToOwn ? { id: scopeToOwn } : undefined,
      orderBy: { order: "asc" },
    }),
    prisma.service.findMany({ orderBy: { order: "asc" } }),
    prisma.serviceCombo.findMany({ include: { services: { select: { id: true } } }, orderBy: { order: "asc" } }),
    prisma.patient.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.insuranceProvider.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
  ]);

  return (
    <TurnosClient
      appointments={appointments.map((a) => {
        const allServices = [a.service, ...a.extraServices];
        const { totalPrice } = computeTotals(allServices, a.combo);
        return {
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
          serviceIds: allServices.map((s) => s.id),
          serviceName: allServices.map((s) => s.name).join(" + "),
          totalPrice,
          insuranceProviderId: a.insuranceProviderId,
          insuranceProviderName: a.insuranceProvider?.name ?? null,
          insuranceMemberNumber: a.insuranceMemberNumber,
          copaymentAmount: a.copaymentAmount,
        };
      })}
      professionals={professionals.map((p) => ({ id: p.id, name: p.name }))}
      services={services.map((s) => ({ id: s.id, name: s.name, durationMin: s.durationMin, price: s.price }))}
      combos={combos.map((c) => ({ id: c.id, name: c.name, price: c.price, durationMin: c.durationMin, serviceIds: c.services.map((s) => s.id) }))}
      patients={patients.map((p) => ({ id: p.id, firstName: p.firstName, lastName: p.lastName, phone: p.phone, dni: p.dni }))}
      insuranceProviders={insuranceProviders.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}
