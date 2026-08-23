"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/actions/guard";

export type WeekSchedule = Record<number, Array<{ startTime: string; endTime: string }>>;

export async function saveWorkingHours(professionalId: string, schedule: WeekSchedule) {
  const user = await getCurrentAdmin();
  const isSelfService = user?.role === "STAFF" && user.professionalId === professionalId;
  if (!user || !(user.role === "OWNER" || user.role === "ADMIN" || isSelfService)) {
    return { error: "No tenés permisos para editar este horario." };
  }

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
  const user = await getCurrentAdmin();
  if (!user) return { error: "No tenés permisos para realizar esta acción." };
  if (user.role === "STAFF") {
    // Un profesional autogestionado sólo puede bloquear sus propios horarios,
    // nunca un bloqueo de toda la clínica (professionalId null).
    if (!user.professionalId || payload.professionalId !== user.professionalId) {
      return { error: "Sólo podés bloquear tu propia agenda." };
    }
  }
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
  const user = await getCurrentAdmin();
  if (!user) return { error: "No tenés permisos para realizar esta acción." };
  if (user.role === "STAFF") {
    const block = await prisma.blockedSlot.findUnique({ where: { id } });
    if (!block || block.professionalId !== user.professionalId) {
      return { error: "Sólo podés eliminar bloqueos de tu propia agenda." };
    }
  }
  await prisma.blockedSlot.delete({ where: { id } });
  revalidatePath("/admin/bloqueos");
  revalidatePath("/reservar");
  return { success: true };
}
