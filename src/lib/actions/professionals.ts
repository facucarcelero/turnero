"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/actions/guard";

export async function upsertProfessional(payload: {
  id?: string;
  name: string;
  specialty?: string;
  bio?: string;
  color: string;
  active: boolean;
  asksInsurance: boolean;
  insuranceProviderIds: string[];
}) {
  await requireRole("ADMIN");
  if (!payload.name.trim()) return { error: "El nombre es obligatorio." };

  const data = {
    name: payload.name.trim(),
    specialty: payload.specialty?.trim() || null,
    bio: payload.bio?.trim() || null,
    color: payload.color || "#0d9488",
    active: payload.active,
    asksInsurance: payload.asksInsurance,
  };

  if (payload.id) {
    await prisma.professional.update({
      where: { id: payload.id },
      data: { ...data, insuranceProviders: { set: payload.insuranceProviderIds.map((id) => ({ id })) } },
    });
  } else {
    const count = await prisma.professional.count();
    await prisma.professional.create({
      data: {
        ...data,
        order: count,
        insuranceProviders: { connect: payload.insuranceProviderIds.map((id) => ({ id })) },
      },
    });
  }

  revalidatePath("/admin/profesionales");
  revalidatePath("/reservar");
  return { success: true };
}

export async function deleteProfessional(id: string) {
  await requireRole("ADMIN");
  const count = await prisma.appointment.count({ where: { professionalId: id } });
  if (count > 0) {
    return { error: `No se puede eliminar: tiene ${count} turno(s) asociado(s). Podés desactivarlo.` };
  }
  await prisma.professional.delete({ where: { id } });
  revalidatePath("/admin/profesionales");
  revalidatePath("/reservar");
  return { success: true };
}

export async function toggleProfessionalActive(id: string, active: boolean) {
  await requireRole("ADMIN");
  try {
    await prisma.professional.update({ where: { id }, data: { active } });
  } catch {
    return { error: "No se pudo actualizar el profesional." };
  }
  revalidatePath("/admin/profesionales");
  revalidatePath("/reservar");
  return { success: true };
}
