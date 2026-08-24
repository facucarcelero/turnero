// Orquesta una consulta de cobertura: registry -> dedupe -> conector ->
// auditoría. Sin import de prisma: la persistencia se recibe inyectada
// (deps.record) para que sea testeable sin DB real (ver
// src/lib/coverage/index.ts para la composición con el repo real).

import { dedupe } from "@/lib/coverage/services/dedupe";
import { resolveProviderForInsurance } from "@/lib/coverage/providers/registry";
import type { CoverageCheckRequest, CoverageCheckResult, CoverageRequestSource, RecordVerificationFn } from "@/lib/coverage/domain/types";

export type VerifyCoverageInput = {
  insuranceProviderId: string;
  connectorKey?: string | null;
  memberNumber?: string | null;
  patientDni?: string | null;
  professionalId?: string | null;
  serviceId?: string | null;
  source: CoverageRequestSource;
  appointmentId?: string | null;
  patientId?: string | null;
  requestedById?: string | null;
};

export type VerifyCoverageDeps = { record: RecordVerificationFn };

export async function verifyCoverage(input: VerifyCoverageInput, deps: VerifyCoverageDeps): Promise<CoverageCheckResult> {
  const request: CoverageCheckRequest = {
    insuranceProviderId: input.insuranceProviderId,
    connectorKey: input.connectorKey ?? null,
    memberNumber: input.memberNumber,
    patientDni: input.patientDni,
    professionalId: input.professionalId,
    serviceId: input.serviceId,
  };

  const dedupeKey = [
    request.insuranceProviderId,
    request.memberNumber ?? "",
    request.professionalId ?? "",
    request.serviceId ?? "",
  ].join("|");

  const result = await dedupe(dedupeKey, () => {
    const provider = resolveProviderForInsurance(request.connectorKey);
    return provider.checkCoverage(request);
  });

  await deps.record({
    request,
    result,
    source: input.source,
    appointmentId: input.appointmentId,
    patientId: input.patientId,
    requestedById: input.requestedById,
  });

  return result;
}
