"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Search, Plus, UserPlus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { upsertAdminAppointment } from "@/lib/actions/appointments";
import type { AppointmentStatus } from "@prisma/client";

type Patient = { id: string; firstName: string; lastName: string; phone: string; dni: string | null };
type Professional = { id: string; name: string };
type Service = { id: string; name: string; durationMin: number };
type InsuranceProvider = { id: string; name: string };

export type EditableAppointment = {
  id: string;
  patientId: string;
  patientName: string;
  professionalId: string;
  serviceId: string;
  date: string;
  startTime: string;
  notes: string | null;
  status: AppointmentStatus;
  insuranceProviderId: string | null;
  insuranceMemberNumber: string | null;
  copaymentAmount: number | null;
};

const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: "PENDING", label: "Pendiente" },
  { value: "CONFIRMED", label: "Confirmado" },
  { value: "COMPLETED", label: "Atendido" },
  { value: "NO_SHOW", label: "No asistió" },
  { value: "CANCELLED", label: "Cancelado" },
];

export function AppointmentFormModal({
  open,
  onClose,
  patients,
  professionals,
  services,
  insuranceProviders,
  initial,
  defaultDate,
  defaultProfessionalId,
}: {
  open: boolean;
  onClose: () => void;
  patients: Patient[];
  professionals: Professional[];
  services: Service[];
  insuranceProviders: InsuranceProvider[];
  initial?: EditableAppointment;
  defaultDate?: string;
  defaultProfessionalId?: string;
}) {
  const [patientQuery, setPatientQuery] = useState(initial?.patientName ?? "");
  const [patientId, setPatientId] = useState(initial?.patientId);
  const [showResults, setShowResults] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newPatient, setNewPatient] = useState({ firstName: "", lastName: "", phone: "", dni: "" });

  const [professionalId, setProfessionalId] = useState(
    initial?.professionalId ?? defaultProfessionalId ?? professionals[0]?.id ?? ""
  );
  const [serviceId, setServiceId] = useState(initial?.serviceId ?? services[0]?.id ?? "");
  const [date, setDate] = useState(initial?.date ?? defaultDate ?? "");
  const [startTime, setStartTime] = useState(initial?.startTime ?? "09:00");
  const [status, setStatus] = useState<AppointmentStatus>(initial?.status ?? "CONFIRMED");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [insuranceProviderId, setInsuranceProviderId] = useState(initial?.insuranceProviderId ?? "");
  const [insuranceMemberNumber, setInsuranceMemberNumber] = useState(initial?.insuranceMemberNumber ?? "");
  const [copaymentAmount, setCopaymentAmount] = useState(initial?.copaymentAmount?.toString() ?? "");

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filteredPatients = useMemo(() => {
    if (!patientQuery.trim()) return patients.slice(0, 8);
    const q = patientQuery.toLowerCase();
    return patients
      .filter(
        (p) =>
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          p.dni?.includes(q)
      )
      .slice(0, 8);
  }, [patientQuery, patients]);

  function submit() {
    setError(null);
    if (!creatingNew && !patientId) {
      setError("Seleccioná un paciente o creá uno nuevo.");
      return;
    }
    if (creatingNew && (!newPatient.firstName.trim() || !newPatient.lastName.trim() || !newPatient.phone.trim())) {
      setError("Completá nombre, apellido y teléfono del nuevo paciente.");
      return;
    }
    if (!date || !startTime) {
      setError("Elegí fecha y horario.");
      return;
    }

    startTransition(async () => {
      const res = await upsertAdminAppointment({
        id: initial?.id,
        patientId: creatingNew ? undefined : patientId,
        newPatient: creatingNew ? newPatient : undefined,
        professionalId,
        serviceId,
        date,
        startTime,
        notes,
        status,
        insuranceProviderId: insuranceProviderId || null,
        insuranceMemberNumber,
        copaymentAmount: copaymentAmount.trim() ? Number(copaymentAmount) : null,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      toast.success(initial ? "Turno actualizado" : "Turno creado");
      onClose();
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Editar turno" : "Nuevo turno"}
      description="Cargá o modificá un turno manualmente."
    >
      <div className="space-y-4">
        <div>
          <Label>Paciente</Label>
          {creatingNew ? (
            <div className="rounded-xl border border-slate-200 p-3 space-y-2.5 bg-slate-50">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Nombre"
                  value={newPatient.firstName}
                  onChange={(e) => setNewPatient((p) => ({ ...p, firstName: e.target.value }))}
                />
                <Input
                  placeholder="Apellido"
                  value={newPatient.lastName}
                  onChange={(e) => setNewPatient((p) => ({ ...p, lastName: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Teléfono"
                  value={newPatient.phone}
                  onChange={(e) => setNewPatient((p) => ({ ...p, phone: e.target.value }))}
                />
                <Input
                  placeholder="DNI (opcional)"
                  value={newPatient.dni}
                  onChange={(e) => setNewPatient((p) => ({ ...p, dni: e.target.value }))}
                />
              </div>
              <button
                type="button"
                onClick={() => setCreatingNew(false)}
                className="text-xs text-slate-500 hover:underline cursor-pointer"
              >
                Buscar un paciente existente en su lugar
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                className="pl-10"
                placeholder="Buscar por nombre, teléfono o DNI"
                value={patientQuery}
                onChange={(e) => {
                  setPatientQuery(e.target.value);
                  setPatientId(undefined);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
              />
              {showResults && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg max-h-56 overflow-y-auto">
                  {filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setPatientId(p.id);
                        setPatientQuery(`${p.firstName} ${p.lastName}`);
                        setShowResults(false);
                      }}
                      className={cn(
                        "w-full text-left px-3.5 py-2.5 text-sm hover:bg-slate-50 flex items-center justify-between",
                        patientId === p.id && "bg-teal-50"
                      )}
                    >
                      <span>{p.firstName} {p.lastName}</span>
                      <span className="text-xs text-slate-400">{p.phone}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setCreatingNew(true);
                      setShowResults(false);
                      setNewPatient((p) => ({ ...p, firstName: patientQuery }));
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-sm text-[var(--brand)] hover:bg-teal-50 flex items-center gap-2 border-t border-slate-100"
                  >
                    <UserPlus className="size-4" /> Crear paciente nuevo
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Profesional</Label>
            <Select value={professionalId} onChange={(e) => setProfessionalId(e.target.value)}>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Servicio</Label>
            <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.durationMin}min)</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Fecha</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Horario</Label>
            <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
        </div>

        <div>
          <Label>Estado</Label>
          <Select value={status} onChange={(e) => setStatus(e.target.value as AppointmentStatus)}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Obra social</Label>
            <Select value={insuranceProviderId} onChange={(e) => setInsuranceProviderId(e.target.value)}>
              <option value="">Particular</option>
              {insuranceProviders.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>N° de afiliado</Label>
            <Input value={insuranceMemberNumber} onChange={(e) => setInsuranceMemberNumber(e.target.value)} />
          </div>
        </div>
        {insuranceProviderId && (
          <div>
            <Label>Coseguro / copago ($, opcional)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Se completa cuando lo confirmás con la obra social"
              value={copaymentAmount}
              onChange={(e) => setCopaymentAmount(e.target.value)}
            />
          </div>
        )}

        <div>
          <Label>Notas (opcional)</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <FieldError>{error}</FieldError>

        <Button className="w-full" size="lg" loading={pending} onClick={submit}>
          <Plus className="size-4" /> {initial ? "Guardar cambios" : "Crear turno"}
        </Button>
      </div>
    </Modal>
  );
}
