"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "@/lib/availability";
import { resolveServiceCombo, computeTotals } from "@/lib/service-combo";
import { getCurrentAdmin } from "@/lib/actions/guard";
import { checkRateLimit } from "@/lib/rate-limit";
import type { AppointmentStatus } from "@prisma/client";

const BOOKING_LIMIT = 5;
const BOOKING_WINDOW_MS = 60 * 60 * 1000;

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

function slotKeyFor(professionalId: string, date: string, startTime: string, status: AppointmentStatus) {
  return status === "CANCELLED" ? null : `${professionalId}|${date}|${startTime}`;
}

export type BookingPayload = {
  professionalId: string;
  serviceIds: string[];
  date: string;
  startTime: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  dni?: string;
  notes?: string;
  insuranceProviderId?: string | null;
  insuranceMemberNumber?: string;
};

export async function createPublicAppointment(payload: BookingPayload) {
  const {
    professionalId,
    serviceIds,
    date,
    startTime,
    firstName,
    lastName,
    phone,
    email,
    dni,
    notes,
    insuranceProviderId,
    insuranceMemberNumber,
  } = payload;

  if (!professionalId || !serviceIds?.length || !date || !startTime) {
    return { error: "Faltan datos del turno. Volvé a intentar." };
  }
  if (!firstName?.trim() || !lastName?.trim() || !phone?.trim()) {
    return { error: "Completá nombre, apellido y teléfono." };
  }

  // Límite anti-spam: por teléfono y por IP, para no frenar a un paciente
  // legítimo que reserva un par de turnos pero sí a un bot/flood.
  const ip = await clientIp();
  const [phoneLimit, ipLimit] = await Promise.all([
    checkRateLimit(`booking:phone:${phone.trim()}`, BOOKING_LIMIT, BOOKING_WINDOW_MS),
    checkRateLimit(`booking:ip:${ip}`, BOOKING_LIMIT * 3, BOOKING_WINDOW_MS),
  ]);
  if (!phoneLimit.allowed || !ipLimit.allowed) {
    return { error: "Hiciste demasiadas reservas en poco tiempo. Probá de nuevo más tarde." };
  }

  const services = await prisma.service.findMany({ where: { id: { in: serviceIds } } });
  if (services.length !== serviceIds.length) return { error: "Alguno de los servicios seleccionados ya no existe." };

  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    include: { insuranceProviders: true },
  });
  if (!professional) return { error: "El profesional seleccionado ya no existe." };

  // La cobertura se guarda si existe y está activa, sin depender del profesional.
  const validInsuranceId = insuranceProviderId
    ? (await prisma.insuranceProvider.findFirst({ where: { id: insuranceProviderId, active: true } }))
      ? insuranceProviderId
      : null
    : null;

  // Revalidamos disponibilidad en el servidor para evitar dobles reservas (race conditions).
  const availableSlots = await getAvailableSlots(professionalId, serviceIds, date);
  const stillAvailable = availableSlots.some((s) => s.startTime === startTime);
  if (!stillAvailable) {
    return {
      error:
        "Ese horario ya no está disponible. Por favor elegí otro horario.",
      stale: true,
    };
  }

  const endTime = availableSlots.find((s) => s.startTime === startTime)!.endTime;
  const combo = await resolveServiceCombo(serviceIds);
  const [serviceId, ...extraServiceIds] = serviceIds;

  let appointment;
  try {
    appointment = await prisma.$transaction(async (tx) => {
      let patient = dni?.trim() ? await tx.patient.findFirst({ where: { dni: dni.trim() } }) : null;
      if (!patient) {
        patient = await tx.patient.findFirst({ where: { phone: phone.trim() } });
      }

      if (patient) {
        patient = await tx.patient.update({
          where: { id: patient.id },
          data: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim(),
            email: email?.trim() || patient.email,
            dni: dni?.trim() || patient.dni,
            insuranceProviderId: validInsuranceId ?? patient.insuranceProviderId,
            insuranceMemberNumber: insuranceMemberNumber?.trim() || patient.insuranceMemberNumber,
          },
        });
      } else {
        patient = await tx.patient.create({
          data: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim(),
            email: email?.trim() || undefined,
            dni: dni?.trim() || undefined,
            insuranceProviderId: validInsuranceId,
            insuranceMemberNumber: insuranceMemberNumber?.trim() || undefined,
          },
        });
      }

      return tx.appointment.create({
        data: {
          professionalId,
          serviceId,
          extraServices: extraServiceIds.length ? { connect: extraServiceIds.map((id) => ({ id })) } : undefined,
          comboId: combo?.id,
          patientId: patient.id,
          date,
          startTime,
          endTime,
          notes: notes?.trim() || undefined,
          status: "PENDING",
          source: "ONLINE",
          insuranceProviderId: validInsuranceId,
          insuranceMemberNumber: insuranceMemberNumber?.trim() || undefined,
          activeSlotKey: slotKeyFor(professionalId, date, startTime, "PENDING"),
        },
      });
    });
  } catch (err) {
    // Red de seguridad para la carrera entre el chequeo de disponibilidad de
    // arriba y el create: si otra reserva ganó la carrera por el mismo
    // horario, el índice único de activeSlotKey rechaza esta.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return {
        error: "Ese horario ya no está disponible. Por favor elegí otro horario.",
        stale: true,
      };
    }
    throw err;
  }

  revalidatePath("/admin");
  revalidatePath("/admin/agenda");
  revalidatePath("/admin/turnos");

  return { success: true, appointmentId: appointment.id, cancelToken: appointment.cancelToken };
}

export async function cancelAppointmentByToken(token: string, reason?: string) {
  const appointment = await prisma.appointment.findUnique({ where: { cancelToken: token } });
  if (!appointment) return { error: "Turno no encontrado." };
  if (appointment.status === "CANCELLED") return { success: true };

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: "CANCELLED", cancelReason: reason || "Cancelado por el paciente", activeSlotKey: null },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/agenda");
  revalidatePath("/admin/turnos");
  return { success: true };
}

export async function findAppointmentsByContact(phone?: string, dni?: string) {
  const conditions = [
    phone?.trim() ? { patient: { phone: phone.trim() } } : undefined,
    dni?.trim() ? { patient: { dni: dni.trim() } } : undefined,
  ].filter(Boolean) as object[];
  if (conditions.length === 0) return [];

  const appointments = await prisma.appointment.findMany({
    where: { OR: conditions },
    include: { service: true, extraServices: true, professional: true, patient: true },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
    take: 30,
  });
  return appointments;
}

// ---------------------------------------------------------------------------
// Admin actions
// ---------------------------------------------------------------------------

export async function updateAppointmentStatus(id: string, status: AppointmentStatus, reason?: string) {
  const user = await getCurrentAdmin();
  if (!user) return { error: "No tenés permisos para realizar esta acción." };

  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) return { error: "No se pudo actualizar el turno." };
  if (user.role === "STAFF" && user.professionalId && appointment.professionalId !== user.professionalId) {
    return { error: "Sólo podés gestionar turnos de tu propia agenda." };
  }

  try {
    await prisma.appointment.update({
      where: { id },
      data: {
        status,
        cancelReason: status === "CANCELLED" ? reason : undefined,
        activeSlotKey: slotKeyFor(appointment.professionalId, appointment.date, appointment.startTime, status),
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Ese horario ya está ocupado por otro turno activo." };
    }
    return { error: "No se pudo actualizar el turno." };
  }
  revalidatePath("/admin");
  revalidatePath("/admin/agenda");
  revalidatePath("/admin/turnos");
  return { success: true };
}

export async function deleteAppointment(id: string) {
  const user = await getCurrentAdmin();
  if (!user) return { error: "No tenés permisos para realizar esta acción." };

  if (user.role === "STAFF" && user.professionalId) {
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment || appointment.professionalId !== user.professionalId) {
      return { error: "Sólo podés eliminar turnos de tu propia agenda." };
    }
  }

  await prisma.appointment.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/admin/agenda");
  revalidatePath("/admin/turnos");
  return { success: true };
}

export type AdminAppointmentPayload = {
  id?: string;
  patientId?: string;
  newPatient?: { firstName: string; lastName: string; phone: string; email?: string; dni?: string };
  professionalId: string;
  serviceIds: string[];
  date: string;
  startTime: string;
  notes?: string;
  status: AppointmentStatus;
  insuranceProviderId?: string | null;
  insuranceMemberNumber?: string;
  copaymentAmount?: number | null;
  insuranceVerified?: boolean;
  insuranceVerifiedUntil?: string | null;
};

export async function upsertAdminAppointment(payload: AdminAppointmentPayload) {
  const {
    id,
    patientId,
    newPatient,
    professionalId,
    serviceIds,
    date,
    startTime,
    notes,
    status,
    insuranceProviderId,
    insuranceMemberNumber,
    copaymentAmount,
    insuranceVerified,
    insuranceVerifiedUntil,
  } = payload;

  const user = await getCurrentAdmin();
  if (!user) return { error: "No tenés permisos para realizar esta acción." };
  if (user.role === "STAFF" && user.professionalId && professionalId !== user.professionalId) {
    return { error: "Sólo podés cargar turnos en tu propia agenda." };
  }
  if (id && user.role === "STAFF" && user.professionalId) {
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing || existing.professionalId !== user.professionalId) {
      return { error: "Sólo podés editar turnos de tu propia agenda." };
    }
  }

  if (!professionalId || !serviceIds?.length || !date || !startTime) {
    return { error: "Completá todos los campos obligatorios." };
  }

  const services = await prisma.service.findMany({ where: { id: { in: serviceIds } } });
  if (services.length !== serviceIds.length) return { error: "Servicio inválido." };

  const combo = await resolveServiceCombo(serviceIds);
  const { totalDurationMin } = computeTotals(services, combo);
  const [serviceId, ...extraServiceIds] = serviceIds;

  const [h, m] = startTime.split(":").map(Number);
  const endMinutes = h * 60 + m + totalDurationMin;
  const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;

  let finalPatientId = patientId;
  if (!finalPatientId && newPatient) {
    if (!newPatient.firstName.trim() || !newPatient.lastName.trim() || !newPatient.phone.trim()) {
      return { error: "Completá los datos del paciente." };
    }
    const patient = await prisma.patient.create({
      data: {
        firstName: newPatient.firstName.trim(),
        lastName: newPatient.lastName.trim(),
        phone: newPatient.phone.trim(),
        email: newPatient.email?.trim() || undefined,
        dni: newPatient.dni?.trim() || undefined,
      },
    });
    finalPatientId = patient.id;
  }

  if (!finalPatientId) return { error: "Seleccioná o cargá un paciente." };

  // Chequeo de superposición (excluyendo el propio turno si se está editando)
  const overlapping = await prisma.appointment.findMany({
    where: {
      professionalId,
      date,
      status: { not: "CANCELLED" },
      id: id ? { not: id } : undefined,
    },
  });
  const startMin = h * 60 + m;
  const hasOverlap = overlapping.some((a) => {
    const [ah, am] = a.startTime.split(":").map(Number);
    const [eh, em] = a.endTime.split(":").map(Number);
    const aStart = ah * 60 + am;
    const aEnd = eh * 60 + em;
    return startMin < aEnd && endMinutes > aStart;
  });
  if (hasOverlap) {
    return { error: "Ese horario se superpone con otro turno existente." };
  }

  try {
    if (id) {
      await prisma.appointment.update({
        where: { id },
        data: {
          patientId: finalPatientId,
          professionalId,
          serviceId,
          extraServices: { set: extraServiceIds.map((eid) => ({ id: eid })) },
          comboId: combo?.id ?? null,
          date,
          startTime,
          endTime,
          notes: notes?.trim() || null,
          status,
          insuranceProviderId: insuranceProviderId || null,
          insuranceMemberNumber: insuranceMemberNumber?.trim() || null,
          copaymentAmount: copaymentAmount ?? null,
          insuranceVerified: insuranceProviderId ? (insuranceVerified ?? false) : false,
          insuranceVerifiedUntil: insuranceProviderId ? insuranceVerifiedUntil?.trim() || null : null,
          activeSlotKey: slotKeyFor(professionalId, date, startTime, status),
        },
      });
    } else {
      await prisma.appointment.create({
        data: {
          patientId: finalPatientId,
          professionalId,
          serviceId,
          extraServices: extraServiceIds.length ? { connect: extraServiceIds.map((eid) => ({ id: eid })) } : undefined,
          comboId: combo?.id,
          date,
          startTime,
          endTime,
          notes: notes?.trim() || undefined,
          status,
          source: "ADMIN",
          insuranceProviderId: insuranceProviderId || undefined,
          insuranceMemberNumber: insuranceMemberNumber?.trim() || undefined,
          copaymentAmount: copaymentAmount ?? undefined,
          insuranceVerified: insuranceProviderId ? (insuranceVerified ?? false) : false,
          insuranceVerifiedUntil: insuranceProviderId ? insuranceVerifiedUntil?.trim() || undefined : undefined,
          activeSlotKey: slotKeyFor(professionalId, date, startTime, status),
        },
      });
    }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Ese horario ya está ocupado por otro turno activo." };
    }
    throw err;
  }

  revalidatePath("/admin");
  revalidatePath("/admin/agenda");
  revalidatePath("/admin/turnos");
  return { success: true };
}
