"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type WeekSchedule = Record<number, Array<{ startTime: string; endTime: string }>>;

export async function saveWorkingHours(professionalId: string, schedule: WeekSchedule) {
  for (const ranges of Object.values(schedule)) {
    for (const r of ranges) {
      if (r.startTime >= r.endTime) {
        return { error: "El horario de inicio debe ser anterior al de fin." };
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.workingHour.deleteMany({ where: { professionalId } });
    const rows: Array<{ professionalId: string; weekday: number; startTime: string; endTime: string }> = [];
    for (const [weekday, ranges] of Object.entries(schedule)) {
      for (const r of ranges) {
        rows.push({ professionalId, weekday: Number(weekday), startTime: r.startTime, endTime: r.endTime });
      }
    }
    if (rows.length > 0) {
      await tx.workingHour.createMany({ data: rows });
    }
  });

  revalidatePath("/admin/horarios");
  revalidatePath("/reservar");
  return { success: true };
}

export async function createBlockedSlot(payload: {
  professionalId: string | null;
  date: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
}) {
  if (!payload.date) return { error: "Seleccioná una fecha." };
  await prisma.blockedSlot.create({
    data: {
      professionalId: payload.professionalId || null,
      date: payload.date,
      startTime: payload.startTime || null,
      endTime: payload.endTime || null,
      reason: payload.reason?.trim() || null,
    },
  });
  revalidatePath("/admin/bloqueos");
  revalidatePath("/reservar");
  return { success: true };
}

export async function deleteBlockedSlot(id: string) {
  await prisma.blockedSlot.delete({ where: { id } });
  revalidatePath("/admin/bloqueos");
  revalidatePath("/reservar");
  return { success: true };
}
