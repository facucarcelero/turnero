import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/actions/guard";
import { CONNECTOR_REGISTRY } from "@/lib/coverage/providers/registry";
import { CoberturasClient } from "./coberturas-client";

export const dynamic = "force-dynamic";

export default async function CoberturasPage() {
  await requirePageRole("ADMIN");

  const [providers, professionals, services, copayRules, agreements] = await Promise.all([
    prisma.insuranceProvider.findMany({ orderBy: { order: "asc" } }),
    prisma.professional.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
    prisma.service.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
    prisma.copayRule.findMany({
      include: { insuranceProvider: true, professional: true, service: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.providerAgreement.findMany({
      include: { professional: true, insuranceProvider: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const connectors = Object.entries(CONNECTOR_REGISTRY).map(([key, entry]) => ({
    key,
    label: entry.label,
    connectorStatus: entry.provider.connectorStatus,
  }));

  return (
    <CoberturasClient
      providers={providers.map((p) => ({ id: p.id, name: p.name, connectorKey: p.connectorKey }))}
      professionals={professionals.map((p) => ({ id: p.id, name: p.name }))}
      services={services.map((s) => ({ id: s.id, name: s.name }))}
      connectors={connectors}
      copayRules={copayRules.map((r) => ({
        id: r.id,
        insuranceProviderId: r.insuranceProviderId,
        insuranceProviderName: r.insuranceProvider.name,
        professionalId: r.professionalId,
        professionalName: r.professional?.name ?? null,
        serviceId: r.serviceId,
        serviceName: r.service?.name ?? null,
        planName: r.planName,
        copaymentAmount: r.copaymentAmount.toString(),
        active: r.active,
      }))}
      providerAgreements={agreements.map((a) => ({
        id: a.id,
        professionalId: a.professionalId,
        professionalName: a.professional.name,
        insuranceProviderId: a.insuranceProviderId,
        insuranceProviderName: a.insuranceProvider.name,
        status: a.status,
        rnpCode: a.rnpCode,
        effectiveFrom: a.effectiveFrom ? a.effectiveFrom.toISOString().slice(0, 10) : null,
        effectiveTo: a.effectiveTo ? a.effectiveTo.toISOString().slice(0, 10) : null,
      }))}
    />
  );
}
