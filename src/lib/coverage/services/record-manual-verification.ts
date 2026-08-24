// Envuelve el guardado del checkbox manual "Cobertura verificada" del
// staff (appointment-form-modal.tsx). Devuelve exactamente el mismo shape
// que upsertAdminAppointment ya persiste hoy en Appointment
// (insuranceVerified/insuranceVerifiedUntil) -- cero cambio de
// comportamiento visible -- y además dispara una fila de auditoría
// CoverageVerification. Esta confirmación es humana (source: "MANUAL_STAFF"),
// no una inferencia del motor: por eso, a diferencia de cualquier resultado
// de conector, sí puede registrarse como ACTIVE cuando el staff tilda el
// checkbox (ver regla dura #3 del plan).

import type { CoverageCheckRequest, CoverageCheckResult, RecordVerificationFn } from "@/lib/coverage/domain/types";

export type RecordManualVerificationInput = {
  insuranceProviderId: string | null;
  insuranceVerified: boolean | null | undefined;
  insuranceVerifiedUntil?: string | null;
  memberNumber?: string | null;
  staffUserId?: string | null;
  appointmentId?: string | null;
  patientId?: string | null;
};

export type RecordManualVerificationResult = {
  insuranceVerified: boolean;
  insuranceVerifiedUntil: string | null;
};

export type RecordManualVerificationDeps = { record: RecordVerificationFn };

export async function recordManualVerification(
  input: RecordManualVerificationInput,
  deps: RecordManualVerificationDeps
): Promise<RecordManualVerificationResult> {
  const insuranceVerified = input.insuranceProviderId ? Boolean(input.insuranceVerified) : false;
  const insuranceVerifiedUntil = input.insuranceProviderId ? input.insuranceVerifiedUntil?.trim() || null : null;

  if (input.insuranceProviderId) {
    const request: CoverageCheckRequest = {
      insuranceProviderId: input.insuranceProviderId,
      connectorKey: null,
      memberNumber: input.memberNumber,
    };
    const result: CoverageCheckResult = {
      state: insuranceVerified ? "ACTIVE" : "MANUAL_VERIFICATION_REQUIRED",
      connectorStatus: "NOT_AVAILABLE",
      sourceId: "MANUAL_STAFF",
      message: insuranceVerified
        ? "Confirmado manualmente por el staff."
        : "Pendiente de verificación manual por el staff.",
      verifiedUntil: insuranceVerifiedUntil,
      durationMs: 0,
    };

    await deps.record({
      request,
      result,
      source: "ADMIN",
      appointmentId: input.appointmentId,
      patientId: input.patientId,
      requestedById: input.staffUserId,
    });
  }

  return { insuranceVerified, insuranceVerifiedUntil };
}
