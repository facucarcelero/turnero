import type { CoverageProvider } from "@/lib/coverage/domain/types";

/**
 * Único conector real disponible hoy: ningún organismo (SSSalud, PAMI,
 * IOMA, prepagas) publica una API oficial abierta para que una clínica
 * privada verifique cobertura por software (ver COVERAGE_ENGINE.md). Este
 * conector nunca inventa una respuesta positiva: siempre devuelve
 * MANUAL_VERIFICATION_REQUIRED / NOT_AVAILABLE. Reemplazar por un conector
 * real sólo cuando exista un mecanismo oficial documentado y la clínica
 * esté autorizada como prestador para usarlo (regla dura #4).
 */
export function createUnavailableProvider(key: string): CoverageProvider {
  return {
    key,
    connectorStatus: "NOT_AVAILABLE",
    async checkCoverage() {
      const start = Date.now();
      return {
        state: "MANUAL_VERIFICATION_REQUIRED",
        connectorStatus: "NOT_AVAILABLE",
        sourceId: `UNAVAILABLE_OFFICIAL:${key}`,
        message: "No hay integración automática con esta cobertura todavía. Confirmalo manualmente.",
        durationMs: Date.now() - start,
      };
    },
  };
}
