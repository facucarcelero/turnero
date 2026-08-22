"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function updateClinicSettings(payload: {
  name: string;
  tagline?: string;
  logoUrl?: string;
  primaryColor: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  instagram?: string;
  slotDurationMin: number;
  minNoticeHours: number;
  maxAdvanceDays: number;
  allowCancelation: boolean;
  cancelNoticeHours: number;
  currency: string;
  welcomeMessage?: string;
}) {
  if (!payload.name.trim()) return { error: "El nombre de la clínica es obligatorio." };

  const existing = await prisma.clinic.findFirst();
  const data = {
    name: payload.name.trim(),
    tagline: payload.tagline?.trim() || "",
    logoUrl: payload.logoUrl?.trim() || null,
    primaryColor: payload.primaryColor || "#0d9488",
    address: payload.address?.trim() || null,
    phone: payload.phone?.trim() || null,
    whatsapp: payload.whatsapp?.trim() || null,
    email: payload.email?.trim() || null,
    instagram: payload.instagram?.trim() || null,
    slotDurationMin: payload.slotDurationMin || 30,
    minNoticeHours: payload.minNoticeHours ?? 2,
    maxAdvanceDays: payload.maxAdvanceDays || 60,
    allowCancelation: payload.allowCancelation,
    cancelNoticeHours: payload.cancelNoticeHours ?? 24,
    currency: payload.currency || "ARS",
    welcomeMessage: payload.welcomeMessage?.trim() || "",
  };

  if (existing) {
    await prisma.clinic.update({ where: { id: existing.id }, data });
  } else {
    await prisma.clinic.create({ data });
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function upsertAdminUser(payload: {
  id?: string;
  name: string;
  email: string;
  password?: string;
  role: "OWNER" | "ADMIN" | "STAFF";
  active: boolean;
}) {
  if (!payload.name.trim() || !payload.email.trim()) {
    return { error: "Nombre y email son obligatorios." };
  }

  if (payload.id) {
    const data: Record<string, unknown> = {
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      role: payload.role,
      active: payload.active,
    };
    if (payload.password?.trim()) {
      data.passwordHash = await bcrypt.hash(payload.password.trim(), 10);
    }
    await prisma.adminUser.update({ where: { id: payload.id }, data });
  } else {
    if (!payload.password?.trim() || payload.password.trim().length < 6) {
      return { error: "La contraseña debe tener al menos 6 caracteres." };
    }
    const existing = await prisma.adminUser.findUnique({ where: { email: payload.email.trim().toLowerCase() } });
    if (existing) return { error: "Ya existe un usuario con ese email." };
    await prisma.adminUser.create({
      data: {
        name: payload.name.trim(),
        email: payload.email.trim().toLowerCase(),
        passwordHash: await bcrypt.hash(payload.password.trim(), 10),
        role: payload.role,
        active: payload.active,
      },
    });
  }

  revalidatePath("/admin/configuracion");
  return { success: true };
}

export async function deleteAdminUser(id: string) {
  const count = await prisma.adminUser.count();
  if (count <= 1) return { error: "Debe existir al menos un usuario administrador." };
  await prisma.adminUser.delete({ where: { id } });
  revalidatePath("/admin/configuracion");
  return { success: true };
}
