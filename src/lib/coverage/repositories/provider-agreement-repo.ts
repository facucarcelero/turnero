import "server-only";
import { prisma } from "@/lib/prisma";
import type { ProviderAgreementStatus } from "@prisma/client";

export async function listProviderAgreements() {
  return prisma.providerAgreement.findMany({
    include: { professional: true, insuranceProvider: true },
    orderBy: { createdAt: "desc" },
  });
}

export type UpsertProviderAgreementInput = {
  id?: string;
  professionalId: string;
  insuranceProviderId: string;
  status: ProviderAgreementStatus;
  rnpCode?: string | null;
  effectiveFrom?: Date | null;
  effectiveTo?: Date | null;
  notes?: string | null;
};

export async function upsertProviderAgreement(payload: UpsertProviderAgreementInput) {
  const data = {
    professionalId: payload.professionalId,
    insuranceProviderId: payload.insuranceProviderId,
    status: payload.status,
    rnpCode: payload.rnpCode || null,
    effectiveFrom: payload.effectiveFrom ?? null,
    effectiveTo: payload.effectiveTo ?? null,
    notes: payload.notes || null,
  };
  if (payload.id) {
    return prisma.providerAgreement.update({ where: { id: payload.id }, data });
  }
  return prisma.providerAgreement.create({ data });
}

export async function deleteProviderAgreement(id: string) {
  return prisma.providerAgreement.delete({ where: { id } });
}
