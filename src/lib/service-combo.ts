import { prisma } from "@/lib/prisma";
import { computeTotals, type ComboMatch } from "@/lib/combo-totals";

export { computeTotals };
export type { ComboMatch };

/**
 * Busca un ServiceCombo activo cuyo conjunto de servicios sea EXACTAMENTE
 * igual al conjunto pedido (sin importar el orden). Con 0 o 1 servicio no
 * hay combo posible: se comporta igual que un turno de un solo servicio.
 */
export async function resolveServiceCombo(serviceIds: string[]): Promise<ComboMatch | null> {
  if (serviceIds.length < 2) return null;

  const wanted = new Set(serviceIds);
  const candidates = await prisma.serviceCombo.findMany({
    where: { active: true, services: { some: { id: { in: serviceIds } } } },
    include: { services: { select: { id: true } } },
  });

  const match = candidates.find((c) => {
    if (c.services.length !== wanted.size) return false;
    return c.services.every((s) => wanted.has(s.id));
  });

  return match ? { id: match.id, price: match.price, durationMin: match.durationMin } : null;
}
