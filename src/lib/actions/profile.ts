"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/actions/guard";

/**
 * Autogestión: un profesional con usuario vinculado edita su propio
 * perfil público (nombre, especialidad, bio, foto, color) sin necesitar
 * que un OWNER/ADMIN lo haga por él.
 */
export async function updateOwnProfessionalProfile(payload: {
  name: string;
  specialty?: string;
  bio?: string;
  photoUrl?: string;
  color: string;
}) {
  const user = await getCurrentAdmin();
  if (!user?.professionalId) return { error: "No tenés un perfil de profesional vinculado." };
  if (!payload.name.trim()) return { error: "El nombre es obligatorio." };

  await prisma.professional.update({
    where: { id: user.professionalId },
    data: {
      name: payload.name.trim(),
      specialty: payload.specialty?.trim() || null,
      bio: payload.bio?.trim() || null,
      photoUrl: payload.photoUrl?.trim() || null,
      color: payload.color || "#0d9488",
    },
  });

  revalidatePath("/admin/mi-perfil");
  revalidatePath("/");
  revalidatePath("/reservar");
  return { success: true };
}

export async function updateOwnPassword(payload: { currentPassword: string; newPassword: string }) {
  const user = await getCurrentAdmin();
  if (!user) return { error: "Sesión inválida." };
  if (!payload.newPassword || payload.newPassword.length < 8) {
    return { error: "La nueva contraseña debe tener al menos 8 caracteres." };
  }

  const record = await prisma.adminUser.findUnique({ where: { id: user.id } });
  if (!record) return { error: "Usuario no encontrado." };

  const valid = await bcrypt.compare(payload.currentPassword, record.passwordHash);
  if (!valid) return { error: "La contraseña actual no es correcta." };

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(payload.newPassword, 10) },
  });

  return { success: true };
}
