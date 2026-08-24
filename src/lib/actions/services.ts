"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/actions/guard";

export async function upsertService(payload: {
  id?: string;
  name: string;
  description?: string;
  durationMin: number;
  price: number;
  color: string;
  active: boolean;
  professionalIds: string[];
}) {
  await requireRole("ADMIN");
  if (!payload.name.trim()) return { error: "El nombre es obligatorio." };
  if (!payload.durationMin || payload.durationMin < 5) {
    return { error: "La duración mínima es de 5 minutos." };
  }
  if (payload.professionalIds.length === 0) {
    return { error: "Seleccioná al menos un profesional." };
  }

  const base = {
    name: payload.name.trim(),
    description: payload.description?.trim() || null,
    durationMin: payload.durationMin,
    price: payload.price || 0,
    color: payload.color || "#0d9488",
    active: payload.active,
  };

  if (payload.id) {
    await prisma.service.update({
      where: { id: payload.id },
      data: { ...base, professionals: { set: payload.professionalIds.map((id) => ({ id })) } },
    });
  } else {
    const count = await prisma.service.count();
    await prisma.service.create({
      data: { ...base, order: count, professionals: { connect: payload.professionalIds.map((id) => ({ id })) } },
    });
  }

  revalidatePath("/admin/servicios");
  revalidatePath("/reservar");
  return { success: true };
}

export async function deleteService(id: string) {
  await requireRole("ADMIN");
  const [asPrimary, asExtra, inCombo] = await Promise.all([
    prisma.appointment.count({ where: { serviceId: id } }),
    prisma.appointment.count({ where: { extraServices: { some: { id } } } }),
    prisma.serviceCombo.count({ where: { services: { some: { id } } } }),
  ]);
  const count = asPrimary + asExtra;
  if (count > 0) {
    return { error: `No se puede eliminar: tiene ${count} turno(s) asociado(s). Podés desactivarlo.` };
  }
  if (inCombo > 0) {
    return { error: "No se puede eliminar: está en un combo. Podés desactivarlo." };
  }
  await prisma.service.delete({ where: { id } });
  revalidatePath("/admin/servicios");
  revalidatePath("/reservar");
  return { success: true };
}

export async function toggleServiceActive(id: string, active: boolean) {
  await requireRole("ADMIN");
  try {
    await prisma.service.update({ where: { id }, data: { active } });
  } catch {
    return { error: "No se pudo actualizar el servicio." };
  }
  revalidatePath("/admin/servicios");
  revalidatePath("/reservar");
  return { success: true };
}
