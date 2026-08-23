"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Pencil, Check, X as XIcon, CalendarX2, PhoneCall } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { AppointmentFormModal, type EditableAppointment } from "@/components/admin/appointment-form-modal";
import { formatDateShort, todayStr } from "@/lib/time";
import { formatCurrency } from "@/lib/utils";
import { updateAppointmentStatus, deleteAppointment } from "@/lib/actions/appointments";
import type { AppointmentStatus } from "@prisma/client";

type AppointmentRow = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes: string | null;
  patientId: string;
  patientName: string;
  patientPhone: string;
  professionalId: string;
  professionalName: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  insuranceProviderId: string | null;
  insuranceProviderName: string | null;
  insuranceMemberNumber: string | null;
  copaymentAmount: number | null;
};

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "Todos los estados" },
  { value: "PENDING", label: "Pendientes" },
  { value: "CONFIRMED", label: "Confirmados" },
  { value: "COMPLETED", label: "Atendidos" },
  { value: "NO_SHOW", label: "No asistió" },
  { value: "CANCELLED", label: "Cancelados" },
];

const RANGE_OPTIONS = [
  { value: "UPCOMING", label: "Próximos" },
  { value: "TODAY", label: "Hoy" },
  { value: "PAST", label: "Pasados" },
  { value: "ALL", label: "Todos" },
];

export function TurnosClient({
  appointments,
  professionals,
  services,
  patients,
  insuranceProviders,
}: {
  appointments: AppointmentRow[];
  professionals: { id: string; name: string }[];
  services: { id: string; name: string; durationMin: number }[];
  patients: { id: string; firstName: string; lastName: string; phone: string; dni: string | null }[];
  insuranceProviders: { id: string; name: string }[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [professionalFilter, setProfessionalFilter] = useState("ALL");
  const [range, setRange] = useState("UPCOMING");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditableAppointment | undefined>(undefined);

  const today = todayStr();

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
      if (professionalFilter !== "ALL" && a.professionalId !== professionalFilter) return false;
      if (range === "TODAY" && a.date !== today) return false;
      if (range === "UPCOMING" && a.date < today) return false;
      if (range === "PAST" && a.date >= today) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (
          !a.patientName.toLowerCase().includes(q) &&
          !a.patientPhone.includes(q) &&
          !a.serviceName.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [appointments, statusFilter, professionalFilter, range, query, today]);

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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Turnos</h1>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} resultado(s)</p>
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

      <Card>
        <CardBody className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              className="pl-10"
              placeholder="Buscar por paciente, teléfono o servicio..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <Select value={range} onChange={(e) => setRange(e.target.value)}>
              {RANGE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </Select>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {FILTER_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </Select>
            <Select
              value={professionalFilter}
              onChange={(e) => setProfessionalFilter(e.target.value)}
              className="col-span-2 sm:col-span-1"
            >
              <option value="ALL">Todos los profesionales</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12 text-slate-400 text-sm">No hay turnos que coincidan con la búsqueda.</CardBody>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((a) => (
            <Card key={a.id}>
              <CardBody className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:w-40 shrink-0">
                  <div className="text-center">
                    <p className="text-xs text-slate-400">{formatDateShort(a.date)}</p>
                    <p className="text-base font-semibold text-slate-900">{a.startTime}</p>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 text-sm">{a.patientName}</p>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <PhoneCall className="size-3" /> {a.patientPhone}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {a.serviceName} · {a.professionalName} · {formatCurrency(a.servicePrice)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap sm:justify-end">
                  {a.insuranceProviderName && <Badge color="blue">{a.insuranceProviderName}</Badge>}
                  <StatusBadge status={a.status} />
                  {a.status === "PENDING" && (
                    <button
                      onClick={() => quickStatus(a.id, "CONFIRMED")}
                      className="rounded-lg p-1.5 text-teal-600 hover:bg-teal-50 cursor-pointer"
                      title="Confirmar"
                    >
                      <Check className="size-4" />
                    </button>
                  )}
                  {(a.status === "PENDING" || a.status === "CONFIRMED") && (
                    <>
                      <button
                        onClick={() => quickStatus(a.id, "COMPLETED")}
                        className="rounded-lg p-1.5 text-green-600 hover:bg-green-50 cursor-pointer text-xs font-medium px-2"
                        title="Marcar como atendido"
                      >
                        Atendido
                      </button>
                      <button
                        onClick={() => quickStatus(a.id, "NO_SHOW")}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 cursor-pointer"
                        title="No asistió"
                      >
                        <XIcon className="size-4" />
                      </button>
                      <button
                        onClick={() => quickStatus(a.id, "CANCELLED")}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 cursor-pointer"
                        title="Cancelar"
                      >
                        <CalendarX2 className="size-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => openEdit(a)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                    title="Editar"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <ConfirmButton
                    action={() => deleteAppointment(a.id)}
                    successText="Turno eliminado"
                  />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <AppointmentFormModal
        key={editing?.id ?? "new"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        patients={patients}
        professionals={professionals}
        services={services}
        insuranceProviders={insuranceProviders}
        initial={editing}
        defaultDate={today}
      />
    </div>
  );
}
