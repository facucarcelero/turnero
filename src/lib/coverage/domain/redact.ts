// Redacción de datos sensibles antes de loguear o persistir en auditoría.
// Nunca deben llegar a un log ni a CoverageVerification: DNI/CUIL completos,
// número de afiliado completo, tokens o credenciales.

/**
 * Enmascara un número de afiliado dejando sólo los últimos 4 caracteres
 * visibles (ej. "123456789" -> "****6789"). Devuelve null si no hay valor.
 */
export function maskMemberNumber(memberNumber: string | null | undefined): string | null {
  const trimmed = memberNumber?.trim();
  if (!trimmed) return null;
  if (trimmed.length <= 4) return "*".repeat(trimmed.length);
  return "*".repeat(trimmed.length - 4) + trimmed.slice(-4);
}

const SENSITIVE_KEYS = ["dni", "cuil", "membernumber", "token", "password", "credential", "secret"];

/**
 * Redacta recursivamente un objeto reemplazando el valor de cualquier
 * clave sensible (case-insensitive) por "[REDACTED]". Usado como red de
 * seguridad antes de escribir a logs, no reemplaza el enmascarado explícito
 * de maskMemberNumber para lo que sí se quiere persistir parcialmente.
 */
export function redactForLog(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactForLog);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => {
        const isSensitive = SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s));
        return [key, isSensitive ? "[REDACTED]" : redactForLog(val)];
      })
    );
  }
  return value;
}
