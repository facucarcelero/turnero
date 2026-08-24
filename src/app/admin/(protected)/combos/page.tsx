import { prisma } from "@/lib/prisma";
import { requirePageRole, getCurrentAdmin } from "@/lib/actions/guard";
import { CombosClient } from "./combos-client";

export const dynamic = "force-dynamic";

export default async function CombosPage() {
  await requirePageRole("STAFF");
  const currentUser = await getCurrentAdmin();
  // Un profesional autogestionado sólo puede combinar (y ver) sus propios servicios.
  const scopeToOwn = currentUser?.role === "STAFF" ? currentUser.professionalId : null;

  const [services, combos] = await Promise.all([
    prisma.service.findMany({
      where: { active: true, ...(scopeToOwn ? { professionals: { some: { id: scopeToOwn } } } : {}) },
      orderBy: { order: "asc" },
    }),
    prisma.serviceCombo.findMany({
      include: { services: true, _count: { select: { appointments: true } } },
      orderBy: { order: "asc" },
    }),
  ]);

  const ownServiceIds = new Set(services.map((s) => s.id));
  const visibleCombos = scopeToOwn
    ? combos.filter((c) => c.services.every((s) => ownServiceIds.has(s.id)))
    : combos;

  return (
    <CombosClient
      combos={visibleCombos.map((c) => ({
        id: c.id,
        name: c.name,
        price: c.price,
        durationMin: c.durationMin,
        active: c.active,
        serviceIds: c.services.map((s) => s.id),
        appointmentsCount: c._count.appointments,
      }))}
      services={services.map((s) => ({ id: s.id, name: s.name, price: s.price, durationMin: s.durationMin }))}
    />
  );
}
