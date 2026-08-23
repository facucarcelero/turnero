"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, Pencil, Check, X as XIcon, CalendarX2, CalendarOff, PhoneCall } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { DayPicker } from "@/components/public/day-picker";
import { AppointmentFormModal, type EditableAppointment } from "@/components/admin/appointment-form-modal";
import { cn } from "@/lib/utils";
import { addDaysStr, formatDateLong, todayStr, weekdayOf } from "@/lib/time";
import { updateAppointmentStatus, deleteAppointment } from "@/lib/actions/appointments";
import type { AppointmentStatus } from "@prisma/client";

type Professional = {
  id: string;
  name: string;
  color: string;
  workingHours: { weekday: number; startTime: string; endTime: string }[];
};

type AppointmentRow = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes: string | null;
  professionalId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  serviceId: string;
  serviceName: string;
  insuranceProviderId: string | null;
  insuranceProviderName: string | null;
  insuranceMemberNumber: string | null;
  copaymentAmount: number | null;
};

type BlockedSlot = {
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  professionalId: string | null;
};

export function AgendaClient({
  professionals,
  appointments,
  blockedSlots,
  services,
  patients,
  insuranceProviders,
}: {
  professionals: Professional[];
  appointments: AppointmentRow[];
  blockedSlots: BlockedSlot[];
  services: { id: string; name: string; durationMin: number }[];
  patients: { id: string; firstName: string; lastName: string; phone: string; dni: string | null }[];
  insuranceProviders: { id: string; name: string }[];
}) {
  const [date, setDate] = useState(todayStr());
  const [professionalId, setProfessionalId] = useState(professionals[0]?.id);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditableAppointment | undefined>(undefined);

  const dayAppointments = useMemo(
    () =>
      appointments
        .filter((a) => a.date === date && a.professionalId === professionalId && a.status !== "CANCELLED")
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [appointments, date, professionalId]
  );

  const dayWorkingHours = useMemo(() => {
    const prof = professionals.find((p) => p.id === professionalId);
    return prof?.workingHours.filter((w) => w.weekday === weekdayOf(date)) ?? [];
  }, [professionals, professionalId, date]);

  const dayBlocked = useMemo(
    () =>
      blockedSlots.filter(
        (b) => b.date === date && (b.professionalId === professionalId || b.professionalId === null)
      ),
    [blockedSlots, date, professionalId]
  );
  const wholeDayBlocked = dayBlocked.find((b) => !b.startTime);

  function openEdit(a: AppointmentRow) {
    setEditing({
      id: a.id,
      patientId: a.patientId,
      patientName: a.patientName,
      professionalId: a.professionalId,
      serviceId: a.serviceId,
      date: a.date,
      startTime: a.startTime,
      notes: a.notes,
      status: a.status,
      insuranceProviderId: a.insuranceProviderId,
      insuranceMemberNumber: a.insuranceMemberNumber,
      copaymentAmount: a.copaymentAmount,
    });
    setModalOpen(true);
  }

  async function quickStatus(id: string, status: AppointmentStatus) {
    const res = await updateAppointmentStatus(id, status);
    if (res.error) toast.error(res.error);
  }

  if (professionals.length === 0) {
    return <Card><CardBody className="text-center py-12 text-slate-400 text-sm">Creá un profesional primero.</CardBody></Card>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Agenda</h1>
          <p className="text-sm text-slate-500 mt-0.5">{formatDateLong(date)}</p>
        </div>
        <Button
          onClick={() => {
            setEditing(undefined);
            setModalOpen(true);
          }}
        >
          <Plus className="size-4" /> Nuevo turno
        </Button>
      </div>

      {professionals.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {professionals.map((p) => (
            <button
              key={p.id}
              onClick={() => setProfessionalId(p.id)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap border shrink-0",
                professionalId === p.id ? "text-white border-transparent" : "bg-white border-slate-200 text-slate-600"
              )}
              style={professionalId === p.id ? { backgroundColor: p.color } : undefined}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      <Card>
        <CardBody>
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setDate((d) => addDaysStr(d, -1))} className="rounded-lg p-2 border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <ChevronLeft className="size-4" />
            </button>
            <button onClick={() => setDate(todayStr())} className="rounded-lg px-3 py-2 text-sm border border-slate-200 hover:bg-slate-50 cursor-pointer font-medium text-slate-600">
              Hoy
            </button>
            <button onClick={() => setDate((d) => addDaysStr(d, 1))} className="rounded-lg p-2 border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <ChevronRight className="size-4" />
            </button>
          </div>
          <DayPicker value={date} onChange={setDate} maxAdvanceDays={150} />
        </CardBody>
      </Card>

      {dayWorkingHours.length > 0 && (
        <p className="text-xs text-slate-400 px-1">
          Horario de atención: {dayWorkingHours.map((w) => `${w.startTime}-${w.endTime}`).join(" y ")}
        </p>
      )}

      {wholeDayBlocked && (
        <Card className="border-red-100 bg-red-50/50">
          <CardBody className="flex items-center gap-3 text-red-700 text-sm">
            <CalendarOff className="size-4 shrink-0" />
            Día bloqueado{wholeDayBlocked.reason ? `: ${wholeDayBlocked.reason}` : ""}
          </CardBody>
        </Card>
      )}

      {dayAppointments.length === 0 ? (
        <Card><CardBody className="text-center py-12 text-slate-400 text-sm">No hay turnos agendados este día.</CardBody></Card>
      ) : (
        <div className="space-y-2.5">
          {dayAppointments.map((a) => (
            <Card key={a.id}>
              <CardBody className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-16 shrink-0 text-center">
                  <p className="text-base font-semibold text-slate-900">{a.startTime}</p>
                  <p className="text-[11px] text-slate-400">{a.endTime}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 text-sm">{a.patientName}</p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <PhoneCall className="size-3" /> {a.patientPhone}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{a.serviceName}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                  {a.insuranceProviderName && <Badge color="blue">{a.insuranceProviderName}</Badge>}
                  <StatusBadge status={a.status} />
                  {a.status === "PENDING" && (
                    <button onClick={() => quickStatus(a.id, "CONFIRMED")} className="rounded-lg p-1.5 text-teal-600 hover:bg-teal-50 cursor-pointer" title="Confirmar">
                      <Check className="size-4" />
                    </button>
                  )}
                  {(a.status === "PENDING" || a.status === "CONFIRMED") && (
                    <>
                      <button onClick={() => quickStatus(a.id, "COMPLETED")} className="rounded-lg p-1.5 text-green-600 hover:bg-green-50 cursor-pointer text-xs font-medium px-2" title="Marcar como atendido">
                        Atendido
                      </button>
                      <button onClick={() => quickStatus(a.id, "NO_SHOW")} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 cursor-pointer" title="No asistió">
                        <XIcon className="size-4" />
                      </button>
                      <button onClick={() => quickStatus(a.id, "CANCELLED")} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 cursor-pointer" title="Cancelar">
                        <CalendarX2 className="size-4" />
                      </button>
                    </>
                  )}
                  <button onClick={() => openEdit(a)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer" title="Editar">
                    <Pencil className="size-4" />
                  </button>
                  <ConfirmButton action={() => deleteAppointment(a.id)} successText="Turno eliminado" />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <AppointmentFormModal
        key={`${editing?.id ?? "new"}-${date}-${professionalId}`}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        patients={patients}
        professionals={professionals}
        services={services}
        insuranceProviders={insuranceProviders}
        initial={editing}
        defaultDate={date}
        defaultProfessionalId={professionalId}
      />
    </div>
  );
}
