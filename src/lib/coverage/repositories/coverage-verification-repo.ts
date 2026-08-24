import "server-only";
import { prisma } from "@/lib/prisma";
import { maskMemberNumber } from "@/lib/coverage/domain/redact";
import type { RecordVerificationParams } from "@/lib/coverage/domain/types";

export async function recordCoverageVerification(params: RecordVerificationParams) {
  const { request, result, source, appointmentId, patientId, requestedById } = params;
  return prisma.coverageVerification.create({
    data: {
      appointmentId: appointmentId ?? undefined,
      patientId: patientId ?? undefined,
      insuranceProviderId: request.insuranceProviderId,
      requestedById: requestedById ?? undefined,
      source,
      state: result.state,
      connectorStatus: result.connectorStatus,
      sourceId: result.sourceId,
      memberNumberMasked: maskMemberNumber(request.memberNumber),
      suggestedCopaymentAmount: result.suggestedCopaymentAmount ?? undefined,
      durationMs: result.durationMs,
      message: result.message,
    },
  });
}

export async function listCoverageVerifications(params: { insuranceProviderId?: string; take?: number } = {}) {
  return prisma.coverageVerification.findMany({
    where: params.insuranceProviderId ? { insuranceProviderId: params.insuranceProviderId } : undefined,
    orderBy: { createdAt: "desc" },
    take: params.take ?? 50,
    include: { insuranceProvider: true },
  });
}
