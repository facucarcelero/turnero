import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/actions/guard";
import { ObrasSocialesClient } from "./obras-sociales-client";

export const dynamic = "force-dynamic";

export default async function ObrasSocialesPage() {
  await requirePageRole("ADMIN");

  const providers = await prisma.insuranceProvider.findMany({
    include: { _count: { select: { patients: true, appointments: true } } },
    orderBy: { order: "asc" },
  });

  return (
    <ObrasSocialesClient
      providers={providers.map((p) => ({
        id: p.id,
        name: p.name,
        active: p.active,
        usageCount: p._count.patients + p._count.appointments,
      }))}
    />
  );
}
