import { prisma } from "@/lib/prisma";
import {
  minutesFromNow,
  minutesToTime,
  timeToMinutes,
  weekdayOf,
} from "@/lib/time";
import { resolveServiceCombo, computeTotals } from "@/lib/service-combo";

export type Slot = {
  startTime: string;
  endTime: string;
};

/**
 * Calcula los horarios disponibles para un profesional + uno o más servicios
 * en una fecha dada. Combina: horario laboral semanal, bloqueos puntuales,
 * turnos ya reservados y las reglas de anticipación mínima definidas en la
 * configuración de la clínica. La duración total es la de un combo
 * configurado (si la combinación de servicios matchea uno) o la suma de las
 * duraciones individuales.
 */
export async function getAvailableSlots(
  professionalId: string,
  serviceIds: string[],
  date: string
): Promise<Slot[]> {
  const [clinic, services, workingHours, blockedSlots, appointments, combo] =
    await Promise.all([
      prisma.clinic.findFirst(),
      prisma.service.findMany({ where: { id: { in: serviceIds } } }),
      prisma.workingHour.findMany({
        where: { professionalId, weekday: weekdayOf(date), active: true },
      }),
      prisma.blockedSlot.findMany({
        where: {
          date,
          OR: [{ professionalId }, { professionalId: null }],
        },
      }),
      prisma.appointment.findMany({
        where: {
          professionalId,
          date,
          status: { not: "CANCELLED" },
        },
      }),
      resolveServiceCombo(serviceIds),
    ]);

  if (services.length !== serviceIds.length || workingHours.length === 0) return [];

  const { totalDurationMin: duration } = computeTotals(services, combo);
  const step = clinic?.slotDurationMin ?? 30;
  const minNoticeMinutes = (clinic?.minNoticeHours ?? 0) * 60;

  // Si hay un bloqueo de día completo, no hay turnos disponibles.
  if (blockedSlots.some((b) => !b.startTime)) return [];

  const busyRanges: Array<[number, number]> = [
    ...appointments.map(
      (a) => [timeToMinutes(a.startTime), timeToMinutes(a.endTime)] as [number, number]
    ),
    ...blockedSlots
      .filter((b) => b.startTime && b.endTime)
      .map((b) => [timeToMinutes(b.startTime!), timeToMinutes(b.endTime!)] as [number, number]),
  ];

  const slots: Slot[] = [];

  for (const wh of workingHours) {
    const startMin = timeToMinutes(wh.startTime);
    const endMin = timeToMinutes(wh.endTime);

    for (let start = startMin; start + duration <= endMin; start += step) {
      const end = start + duration;
      const overlaps = busyRanges.some(([bStart, bEnd]) => start < bEnd && end > bStart);
      if (overlaps) continue;

      const startTime = minutesToTime(start);
      const endTime = minutesToTime(end);

      if (minutesFromNow(date, startTime) < minNoticeMinutes) continue;

      slots.push({ startTime, endTime });
    }
  }

  return slots;
}

/**
 * Devuelve el set de días (YYYY-MM-DD) dentro de un rango en que el profesional
 * tiene al menos un horario laboral configurado (sin verificar disponibilidad puntual).
 * Se usa para pintar el calendario rápidamente sin golpear la DB por cada día.
 */
export async function getWorkingWeekdays(professionalId: string): Promise<Set<number>> {
  const hours = await prisma.workingHour.findMany({
    where: { professionalId, active: true },
    select: { weekday: true },
  });
  return new Set(hours.map((h) => h.weekday));
}
