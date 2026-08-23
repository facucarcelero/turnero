"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/actions/guard";

export async function upsertInsuranceProvider(payload: { id?: string; name: string; active: boolean }) {
  await requireRole("ADMIN");
  if (!payload.name.trim()) return { error: "El nombre es obligatorio." };

  if (payload.id) {
    await prisma.insuranceProvider.update({
      where: { id: payload.id },
      data: { name: payload.name.trim(), active: payload.active },
    });
  } else {
    const count = await prisma.insuranceProvider.count();
    await prisma.insuranceProvider.create({
      data: { name: payload.name.trim(), active: payload.active, order: count },
    });
  }

  revalidatePath("/admin/obras-sociales");
  revalidatePath("/admin/profesionales");
  revalidatePath("/reservar");
  return { success: true };
}

export async function deleteInsuranceProvider(id: string) {
  await requireRole("ADMIN");
  const [appointments, patients] = await Promise.all([
    prisma.appointment.count({ where: { insuranceProviderId: id } }),
    prisma.patient.count({ where: { insuranceProviderId: id } }),
  ]);
  if (appointments > 0 || patients > 0) {
    return { error: "No se puede eliminar: hay pacientes o turnos que la usan. Podés desactivarla." };
  }
  await prisma.insuranceProvider.delete({ where: { id } });
  revalidatePath("/admin/obras-sociales");
  revalidatePath("/admin/profesionales");
  revalidatePath("/reservar");
  return { success: true };
}

export async function toggleInsuranceProviderActive(id: string, active: boolean) {
  await requireRole("ADMIN");
  try {
    await prisma.insuranceProvider.update({ where: { id }, data: { active } });
  } catch {
    return { error: "No se pudo actualizar." };
  }
  revalidatePath("/admin/obras-sociales");
  revalidatePath("/reservar");
  return { success: true };
}
