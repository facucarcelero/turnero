// Sin dependencias de servidor (no importa prisma): se puede usar tanto en
// server actions/libs como en componentes de cliente (ej. el wizard de
// reserva pública, para mostrar el total en vivo mientras se tildan servicios).

export type ComboMatch = {
  id: string;
  price: number | null;
  durationMin: number | null;
};

/**
 * Precio y duración totales de un turno: si hay combo, usa sus overrides;
 * si no, suma los precios/duraciones individuales de cada servicio elegido.
 */
export function computeTotals(
  services: { price: number; durationMin: number }[],
  combo: ComboMatch | null
): { totalPrice: number; totalDurationMin: number } {
  const sumPrice = services.reduce((sum, s) => sum + s.price, 0);
  const sumDuration = services.reduce((sum, s) => sum + s.durationMin, 0);
  return {
    totalPrice: combo?.price ?? sumPrice,
    totalDurationMin: combo?.durationMin ?? sumDuration,
  };
}

/**
 * Busca, dentro de una lista de combos ya cargada en memoria, el que
 * matchea EXACTAMENTE el conjunto de servicios pedido (sin importar el
 * orden). Usado en el cliente para el preview en vivo; el server vuelve a
 * resolverlo con `resolveServiceCombo` (server-combo.ts) por las dudas.
 */
export function findMatchingCombo<T extends ComboMatch & { serviceIds: string[] }>(
  serviceIds: string[],
  combos: T[]
): T | null {
  if (serviceIds.length < 2) return null;
  const wanted = new Set(serviceIds);
  return (
    combos.find((c) => c.serviceIds.length === wanted.size && c.serviceIds.every((id) => wanted.has(id))) ?? null
  );
}
