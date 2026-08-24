// Tipos puros del motor de cobertura: sin import de prisma para que sean
// usables desde Vitest sin DB y, si hiciera falta, desde componentes de
// cliente. La capa de repositorio (repositories/*.ts) es la única que
// traduce entre estos tipos y los enums/Decimal de Prisma.

export type CoverageState =
  | "ACTIVE"
  | "INACTIVE"
  | "BLOCKED"
  | "SUSPENDED"
  | "NOT_FOUND"
  | "AUTHORIZATION_REQUIRED"
  | "NOT_COVERED"
  | "SOURCE_UNAVAILABLE"
  | "UNKNOWN"
  | "MANUAL_VERIFICATION_REQUIRED";

export type CoverageConnectorStatus = "NOT_AVAILABLE" | "AVAILABLE" | "DEGRADED";

/**
 * Estados que NUNCA deben mostrarse al staff como "cobertura activa" o
 * "cubierta" en ninguna UI. Ver regla dura #3 del plan: un resultado de
 * conector caído/desconocido no puede convertirse en una señal positiva.
 */
export const NON_CONFIRMING_STATES: readonly CoverageState[] = [
  "SOURCE_UNAVAILABLE",
  "UNKNOWN",
  "MANUAL_VERIFICATION_REQUIRED",
];

export function isConfirmedActive(state: CoverageState, connectorStatus: CoverageConnectorStatus): boolean {
  return state === "ACTIVE" && connectorStatus === "AVAILABLE";
}

export type CoverageCheckRequest = {
  insuranceProviderId: string;
  connectorKey: string | null;
  memberNumber?: string | null;
  patientDni?: string | null;
  professionalId?: string | null;
  serviceId?: string | null;
};

export type CoverageCheckResult = {
  state: CoverageState;
  connectorStatus: CoverageConnectorStatus;
  sourceId: string;
  message?: string;
  // Decimal representado como string (ej. "1500.00") en el dominio puro;
  // la capa de repositorio convierte a/desde Prisma.Decimal al persistir.
  suggestedCopaymentAmount?: string | null;
  verifiedUntil?: string | null;
  durationMs: number;
};

export interface CoverageProvider {
  readonly key: string;
  readonly connectorStatus: CoverageConnectorStatus;
  checkCoverage(req: CoverageCheckRequest): Promise<CoverageCheckResult>;
}

// Espejo de string-literal del enum Prisma AppointmentSource, para no
// importar @prisma/client (valor, no sólo tipo) desde el dominio puro.
export type CoverageRequestSource = "ONLINE" | "ADMIN";

export type RecordVerificationParams = {
  request: CoverageCheckRequest;
  result: CoverageCheckResult;
  source: CoverageRequestSource;
  appointmentId?: string | null;
  patientId?: string | null;
  requestedById?: string | null;
};

/** Contrato que services/verify-coverage.ts y record-manual-verification.ts reciben inyectado, para no importar prisma directamente. */
export type RecordVerificationFn = (params: RecordVerificationParams) => Promise<unknown>;
