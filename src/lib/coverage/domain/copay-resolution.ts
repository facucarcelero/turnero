// Resolución de coseguro: sin import de prisma. Los montos viajan como
// string decimal (ej. "1500.00"), nunca number, para no perder precisión
// monetaria (regla dura #1) — la capa de repositorio convierte desde/hacia
// Prisma.Decimal en el borde.

export type CopayRuleMatch = {
  id: string;
  professionalId: string | null;
  serviceId: string | null;
  copaymentAmount: string;
  active: boolean;
};

export type CopayResolutionContext = {
  professionalId?: string | null;
  serviceId?: string | null;
};

export type CopayResolution = {
  amount: string | null;
  source: "rule" | "default_copayment" | "none";
  ruleId: string | null;
};

/**
 * Prioridad de resolución: regla exacta profesional+servicio > regla sólo
 * profesional > regla sólo servicio > regla general de la obra social >
 * defaultCopayment (fallback simple, legado) > sin coseguro conocido.
 */
export function resolveCopayAmount(
  rules: CopayRuleMatch[],
  ctx: CopayResolutionContext,
  defaultCopayment: string | null
): CopayResolution {
  const active = rules.filter((r) => r.active);

  const exact = active.find(
    (r) => r.professionalId && r.professionalId === ctx.professionalId && r.serviceId && r.serviceId === ctx.serviceId
  );
  if (exact) return { amount: exact.copaymentAmount, source: "rule", ruleId: exact.id };

  const professionalOnly = active.find(
    (r) => r.professionalId && r.professionalId === ctx.professionalId && !r.serviceId
  );
  if (professionalOnly) return { amount: professionalOnly.copaymentAmount, source: "rule", ruleId: professionalOnly.id };

  const serviceOnly = active.find((r) => r.serviceId && r.serviceId === ctx.serviceId && !r.professionalId);
  if (serviceOnly) return { amount: serviceOnly.copaymentAmount, source: "rule", ruleId: serviceOnly.id };

  const providerWide = active.find((r) => !r.professionalId && !r.serviceId);
  if (providerWide) return { amount: providerWide.copaymentAmount, source: "rule", ruleId: providerWide.id };

  if (defaultCopayment != null) return { amount: defaultCopayment, source: "default_copayment", ruleId: null };

  return { amount: null, source: "none", ruleId: null };
}
