import { createUnavailableProvider } from "@/lib/coverage/providers/unavailable-provider";
import type { CoverageProvider } from "@/lib/coverage/domain/types";

/**
 * Registro de conectores en código (no en DB): el estado de una
 * integración cambia con un deploy, no en runtime. Hoy sólo existe el
 * conector genérico "no disponible" (regla dura #4: prohibido inventar
 * conectores que aparenten verificar cobertura real sin un mecanismo
 * oficial autorizado detrás). Agregar un conector real más adelante es:
 * implementar CoverageProvider, agregar una entrada acá, y taggear el
 * InsuranceProvider.connectorKey correspondiente — sin tocar nada más.
 */
export const CONNECTOR_REGISTRY: Record<string, { label: string; provider: CoverageProvider }> = {
  DEFAULT: { label: "Genérico (sin integración oficial)", provider: createUnavailableProvider("DEFAULT") },
};

export function resolveProviderForInsurance(connectorKey: string | null | undefined): CoverageProvider {
  const entry = connectorKey ? CONNECTOR_REGISTRY[connectorKey] : undefined;
  return (entry ?? CONNECTOR_REGISTRY.DEFAULT).provider;
}
