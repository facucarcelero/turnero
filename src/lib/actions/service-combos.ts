"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/actions/guard";

async function assertOwnServices(userProfessionalId: string | null, serviceIds: string[]) {
  if (!userProfessionalId) return null;
  const owned = await prisma.service.count({
    where: { id: { in: serviceIds }, professionals: { some: { id: userProfessionalId } } },
  });
  if (owned !== serviceIds.length) {
    return "Sólo podés combinar servicios que vos ofrecés.";
  }
  return null;
}

export async function upsertServiceCombo(payload: {
  id?: string;
  name?: string;
  serviceIds: string[];
  price: number | null;
  durationMin: number | null;
  active: boolean;
}) {
  const user = await requireRole("STAFF");

  if (payload.serviceIds.length < 2) {
    return { error: "Elegí al menos dos servicios para combinar." };
  }

  const ownError = await assertOwnServices(user.professionalId, payload.serviceIds);
  if (ownError) return { error: ownError };

  if (payload.id) {
    const existing = await prisma.serviceCombo.findUnique({ where: { id: payload.id }, include: { services: true } });
    if (!existing) return { error: "El combo ya no existe." };
    if (user.role === "STAFF" && user.professionalId) {
      const existingOwnError = await assertOwnServices(user.professionalId, existing.services.map((s) => s.id));
      if (existingOwnError) return { error: "Sólo podés editar combos de tus propios servicios." };
    }
  }

  const base = {
    name: payload.name?.trim() || null,
    price: payload.price !== null && payload.price !== undefined ? payload.price : null,
    durationMin: payload.durationMin !== null && payload.durationMin !== undefined ? payload.durationMin : null,
    active: payload.active,
  };

  if (payload.id) {
    await prisma.serviceCombo.update({
      where: { id: payload.id },
      data: { ...base, services: { set: payload.serviceIds.map((id) => ({ id })) } },
    });
  } else {
    const count = await prisma.serviceCombo.count();
    await prisma.serviceCombo.create({
      data: { ...base, order: count, services: { connect: payload.serviceIds.map((id) => ({ id })) } },
    });
  }

  revalidatePath("/admin/combos");
  revalidatePath("/reservar");
  return { success: true };
}

export async function deleteServiceCombo(id: string) {
  const user = await requireRole("STAFF");
  const combo = await prisma.serviceCombo.findUnique({ where: { id }, include: { services: true } });
  if (!combo) return { error: "El combo ya no existe." };
  if (user.role === "STAFF" && user.professionalId) {
    const ownError = await assertOwnServices(user.professionalId, combo.services.map((s) => s.id));
    if (ownError) return { error: "Sólo podés eliminar combos de tus propios servicios." };
  }
  const count = await prisma.appointment.count({ where: { comboId: id } });
  if (count > 0) {
    return { error: `No se puede eliminar: tiene ${count} turno(s) asociado(s). Podés desactivarlo.` };
  }
  await prisma.serviceCombo.delete({ where: { id } });
  revalidatePath("/admin/combos");
  revalidatePath("/reservar");
  return { success: true };
}

export async function toggleServiceComboActive(id: string, active: boolean) {
  const user = await requireRole("STAFF");
  if (user.role === "STAFF" && user.professionalId) {
    const combo = await prisma.serviceCombo.findUnique({ where: { id }, include: { services: true } });
    if (!combo) return { error: "El combo ya no existe." };
    const ownError = await assertOwnServices(user.professionalId, combo.services.map((s) => s.id));
    if (ownError) return { error: "Sólo podés modificar combos de tus propios servicios." };
  }
  try {
    await prisma.serviceCombo.update({ where: { id }, data: { active } });
  } catch {
    return { error: "No se pudo actualizar el combo." };
  }
  revalidatePath("/admin/combos");
  revalidatePath("/reservar");
  return { success: true };
}
