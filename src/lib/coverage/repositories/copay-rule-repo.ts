import "server-only";
import { prisma } from "@/lib/prisma";
import type { CopayRuleMatch } from "@/lib/coverage/domain/copay-resolution";

export async function listCopayRulesForProvider(insuranceProviderId: string): Promise<CopayRuleMatch[]> {
  const rules = await prisma.copayRule.findMany({ where: { insuranceProviderId } });
  return rules.map((r) => ({
    id: r.id,
    professionalId: r.professionalId,
    serviceId: r.serviceId,
    copaymentAmount: r.copaymentAmount.toString(),
    active: r.active,
  }));
}

export async function listCopayRules() {
  return prisma.copayRule.findMany({
    include: { insuranceProvider: true, professional: true, service: true },
    orderBy: { createdAt: "desc" },
  });
}

export type UpsertCopayRuleInput = {
  id?: string;
  insuranceProviderId: string;
  professionalId?: string | null;
  serviceId?: string | null;
  planName?: string | null;
  copaymentAmount: string;
  active: boolean;
  notes?: string | null;
};

export async function upsertCopayRule(payload: UpsertCopayRuleInput) {
  const data = {
    insuranceProviderId: payload.insuranceProviderId,
    professionalId: payload.professionalId || null,
    serviceId: payload.serviceId || null,
    planName: payload.planName || null,
    copaymentAmount: payload.copaymentAmount,
    active: payload.active,
    notes: payload.notes || null,
  };
  if (payload.id) {
    return prisma.copayRule.update({ where: { id: payload.id }, data });
  }
  return prisma.copayRule.create({ data });
}

export async function deleteCopayRule(id: string) {
  return prisma.copayRule.delete({ where: { id } });
}
