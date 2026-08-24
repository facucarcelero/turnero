// Comparte una única promesa entre llamadas concurrentes con la misma key
// (ej. mismo paciente/obra social consultado dos veces al mismo tiempo),
// para no disparar verificaciones duplicadas. Limitación: el Map vive en
// memoria del proceso, así que no dedupea entre invocaciones serverless
// separadas (mismo límite que ya documenta checkRateLimit en
// src/lib/rate-limit.ts). Hoy los conectores stub resuelven instantáneo,
// así que esto no tiene efecto práctico todavía; existe para que el
// mecanismo ya esté en su lugar cuando un conector real sea más lento.

const inFlight = new Map<string, Promise<unknown>>();

export function dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fn().finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, promise);
  return promise;
}
