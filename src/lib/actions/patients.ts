"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/actions/guard";

export async function upsertPatient(payload: {
  id?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  dni?: string;
  birthDate?: string;
  notes?: string;
  insuranceProviderId?: string | null;
  insuranceMemberNumber?: string;
}) {
  await requireRole("STAFF");
  if (!payload.firstName.trim() || !payload.lastName.trim() || !payload.phone.trim()) {
    return { error: "Nombre, apellido y teléfono son obligatorios." };
  }

  const data = {
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    phone: payload.phone.trim(),
    email: payload.email?.trim() || null,
    dni: payload.dni?.trim() || null,
    birthDate: payload.birthDate || null,
    notes: payload.notes?.trim() || null,
    insuranceProviderId: payload.insuranceProviderId || null,
    insuranceMemberNumber: payload.insuranceMemberNumber?.trim() || null,
  };

  if (payload.id) {
    await prisma.patient.update({ where: { id: payload.id }, data });
  } else {
    await prisma.patient.create({ data });
  }

  revalidatePath("/admin/pacientes");
  return { success: true };
}

export async function deletePatient(id: string) {
  await requireRole("STAFF");
  const count = await prisma.appointment.count({ where: { patientId: id } });
  if (count > 0) {
    return { error: `No se puede eliminar: tiene ${count} turno(s) asociado(s).` };
  }
  await prisma.patient.delete({ where: { id } });
  revalidatePath("/admin/pacientes");
  return { success: true };
}

export async function searchPatients(query: string) {
  await requireRole("STAFF");
  if (!query.trim()) {
    return prisma.patient.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  }
  return prisma.patient.findMany({
    where: {
      OR: [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { phone: { contains: query } },
        { dni: { contains: query } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
