import "server-only";
import { prisma } from "@/lib/prisma";

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

/**
 * Límite simple por ventana fija, respaldado en la base (así funciona bien
 * en serverless, donde cada invocación puede ser un proceso distinto y la
 * memoria no se comparte entre requests).
 */
// No hay cron en este proyecto (ver regla de "no crear procesos eternos"),
// así que la tabla se limpia sola, oportunistamente: con baja probabilidad,
// cada llamada también borra entradas viejas de cualquier límite (no sólo
// el propio), para que no crezca sin límite con el tiempo.
const CLEANUP_PROBABILITY = 0.01;
const CLEANUP_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = new Date();

  if (Math.random() < CLEANUP_PROBABILITY) {
    prisma.rateLimitEntry
      .deleteMany({ where: { windowStart: { lt: new Date(now.getTime() - CLEANUP_MAX_AGE_MS) } } })
      .catch(() => {});
  }

  const entry = await prisma.rateLimitEntry.findUnique({ where: { key } });

  if (!entry || now.getTime() - entry.windowStart.getTime() > windowMs) {
    await prisma.rateLimitEntry.upsert({
      where: { key },
      update: { count: 1, windowStart: now },
      create: { key, count: 1, windowStart: now },
    });
    return { allowed: true };
  }

  if (entry.count >= limit) {
    const retryAfterSeconds = Math.ceil(
      (windowMs - (now.getTime() - entry.windowStart.getTime())) / 1000,
    );
    return { allowed: false, retryAfterSeconds };
  }

  await prisma.rateLimitEntry.update({
    where: { key },
    data: { count: { increment: 1 } },
  });
  return { allowed: true };
}
