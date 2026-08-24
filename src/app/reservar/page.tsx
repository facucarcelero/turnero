import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { BookingWizard } from "./booking-wizard";

export const dynamic = "force-dynamic";

export default async function ReservarPage({
  searchParams,
}: {
  searchParams: Promise<{ servicio?: string }>;
}) {
  const { servicio } = await searchParams;
  const [clinic, services, professionals, insuranceProviders, combos] = await Promise.all([
    prisma.clinic.findFirst(),
    prisma.service.findMany({
      where: { active: true },
      include: { professionals: { where: { active: true }, select: { id: true } } },
      orderBy: { order: "asc" },
    }),
    prisma.professional.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    }),
    prisma.insuranceProvider.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
    prisma.serviceCombo.findMany({
      where: { active: true },
      include: { services: { select: { id: true } } },
      orderBy: { order: "asc" },
    }),
  ]);

  const servicesDTO = services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    durationMin: s.durationMin,
    price: s.price,
    color: s.color,
    professionalIds: s.professionals.map((p) => p.id),
  }));

  const professionalsDTO = professionals.map((p) => ({
    id: p.id,
    name: p.name,
    specialty: p.specialty,
    color: p.color,
  }));

  const insuranceProvidersDTO = insuranceProviders.map((ip) => ({ id: ip.id, name: ip.name }));

  const combosDTO = combos.map((c) => ({
    id: c.id,
    name: c.name,
    price: c.price,
    durationMin: c.durationMin,
    serviceIds: c.services.map((s) => s.id),
  }));

  return (
    <>
      <SiteHeader clinicName={clinic?.name ?? "Turnero"} />
      <main className="flex-1 bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {servicesDTO.length === 0 || professionalsDTO.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              Todavía no hay servicios o profesionales configurados. Volvé a intentar más tarde.
            </div>
          ) : (
            <BookingWizard
              services={servicesDTO}
              professionals={professionalsDTO}
              insuranceProviders={insuranceProvidersDTO}
              combos={combosDTO}
              clinic={{
                currency: clinic?.currency ?? "ARS",
                maxAdvanceDays: clinic?.maxAdvanceDays ?? 60,
                allowCancelation: clinic?.allowCancelation ?? true,
                cancelNoticeHours: clinic?.cancelNoticeHours ?? 24,
              }}
              preselectedServiceId={servicio}
            />
          )}
        </div>
      </main>
      <SiteFooter clinic={clinic} />
    </>
  );
}
