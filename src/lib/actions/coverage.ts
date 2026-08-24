"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/actions/guard";
import { verifyCoverage as verifyCoverageEngine } from "@/lib/coverage";
import { upsertCopayRule as upsertCopayRuleRepo, deleteCopayRule as deleteCopayRuleRepo } from "@/lib/coverage/repositories/copay-rule-repo";
import {
  upsertProviderAgreement as upsertProviderAgreementRepo,
  deleteProviderAgreement as deleteProviderAgreementRepo,
} from "@/lib/coverage/repositories/provider-agreement-repo";
import { listCoverageVerifications as listCoverageVerificationsRepo } from "@/lib/coverage/repositories/coverage-verification-repo";
import type { CoverageRequestSource } from "@/lib/coverage/domain/types";
import type { ProviderAgreementStatus } from "@prisma/client";

const COBERTURAS_PATH = "/admin/coberturas";

/**
 * Uso rutinario de recepción: rol STAFF alcanza. Como todo conector hoy
 * es NOT_AVAILABLE, esto siempre devuelve MANUAL_VERIFICATION_REQUIRED,
 * pero deja el mecanismo (dedupe + auditoría) listo para cuando exista un
 * conector real.
 */
export async function requestCoverageCheck(input: {
  insuranceProviderId: string;
  memberNumber?: string | null;
  professionalId?: string | null;
  serviceId?: string | null;
  appointmentId?: string | null;
  patientId?: string | null;
  source: CoverageRequestSource;
}) {
  const user = await requireRole("STAFF");
  const provider = await prisma.insuranceProvider.findUnique({ where: { id: input.insuranceProviderId } });
  if (!provider) return { error: "La obra social seleccionada ya no existe." };

  const result = await verifyCoverageEngine({
    insuranceProviderId: input.insuranceProviderId,
    connectorKey: provider.connectorKey,
    memberNumber: input.memberNumber,
    professionalId: input.professionalId,
    serviceId: input.serviceId,
    appointmentId: input.appointmentId,
    patientId: input.patientId,
    source: input.source,
    requestedById: user.id,
  });

  return { success: true, result };
}

export async function listCoverageVerifications(insuranceProviderId?: string) {
  await requireRole("ADMIN");
  return listCoverageVerificationsRepo({ insuranceProviderId });
}

export async function updateInsuranceProviderConnectorKey(id: string, connectorKey: string | null) {
  await requireRole("ADMIN");
  try {
    await prisma.insuranceProvider.update({ where: { id }, data: { connectorKey: connectorKey || null } });
  } catch {
    return { error: "No se pudo actualizar." };
  }
  revalidatePath(COBERTURAS_PATH);
  return { success: true };
}

export async function upsertCopayRule(payload: {
  id?: string;
  insuranceProviderId: string;
  professionalId?: string | null;
  serviceId?: string | null;
  planName?: string | null;
  copaymentAmount: string;
  active: boolean;
  notes?: string | null;
}) {
  await requireRole("ADMIN");
  if (!payload.insuranceProviderId) return { error: "Elegí una obra social." };
  if (!payload.copaymentAmount.trim() || Number.isNaN(Number(payload.copaymentAmount))) {
    return { error: "El monto del coseguro es obligatorio y debe ser numérico." };
  }
  await upsertCopayRuleRepo(payload);
  revalidatePath(COBERTURAS_PATH);
  return { success: true };
}

export async function deleteCopayRule(id: string) {
  await requireRole("ADMIN");
  await deleteCopayRuleRepo(id);
  revalidatePath(COBERTURAS_PATH);
  return { success: true };
}

export async function upsertProviderAgreement(payload: {
  id?: string;
  professionalId: string;
  insuranceProviderId: string;
  status: ProviderAgreementStatus;
  rnpCode?: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  notes?: string | null;
}) {
  await requireRole("ADMIN");
  if (!payload.professionalId || !payload.insuranceProviderId) {
    return { error: "Elegí un profesional y una obra social." };
  }
  try {
    await upsertProviderAgreementRepo({
      ...payload,
      effectiveFrom: payload.effectiveFrom ? new Date(payload.effectiveFrom) : null,
      effectiveTo: payload.effectiveTo ? new Date(payload.effectiveTo) : null,
    });
  } catch {
    return { error: "Ya existe un convenio para ese profesional y esa obra social." };
  }
  revalidatePath(COBERTURAS_PATH);
  return { success: true };
}

export async function deleteProviderAgreement(id: string) {
  await requireRole("ADMIN");
  await deleteProviderAgreementRepo(id);
  revalidatePath(COBERTURAS_PATH);
  return { success: true };
}
