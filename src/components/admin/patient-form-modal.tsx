"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/field";
import { upsertPatient } from "@/lib/actions/patients";

export type EditablePatient = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  dni: string | null;
  birthDate: string | null;
  notes: string | null;
  insuranceProviderId: string | null;
  insuranceMemberNumber: string | null;
};

export function PatientFormModal({
  open,
  onClose,
  initial,
  insuranceProviders,
}: {
  open: boolean;
  onClose: () => void;
  initial?: EditablePatient;
  insuranceProviders: { id: string; name: string }[];
}) {
  const [form, setForm] = useState({
    firstName: initial?.firstName ?? "",
    lastName: initial?.lastName ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    dni: initial?.dni ?? "",
    birthDate: initial?.birthDate ?? "",
    notes: initial?.notes ?? "",
    insuranceProviderId: initial?.insuranceProviderId ?? "",
    insuranceMemberNumber: initial?.insuranceMemberNumber ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await upsertPatient({ id: initial?.id, ...form, insuranceProviderId: form.insuranceProviderId || null });
      if (res.error) {
        setError(res.error);
        return;
      }
      toast.success(initial ? "Paciente actualizado" : "Paciente creado");
      onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Editar paciente" : "Nuevo paciente"}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Nombre</Label>
            <Input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
          </div>
          <div>
            <Label>Apellido</Label>
            <Input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Teléfono</Label>
            <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <div>
            <Label>DNI</Label>
            <Input value={form.dni} onChange={(e) => setForm((f) => ({ ...f, dni: e.target.value }))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <Label>Fecha de nacimiento</Label>
            <Input type="date" value={form.birthDate} onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Obra social / prepaga</Label>
            <Select
              value={form.insuranceProviderId}
              onChange={(e) => setForm((f) => ({ ...f, insuranceProviderId: e.target.value }))}
            >
              <option value="">Particular / sin cobertura</option>
              {insuranceProviders.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>N° de afiliado</Label>
            <Input
              value={form.insuranceMemberNumber}
              onChange={(e) => setForm((f) => ({ ...f, insuranceMemberNumber: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <Label>Notas / antecedentes (opcional)</Label>
          <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        </div>
        <FieldError>{error}</FieldError>
        <Button className="w-full" size="lg" loading={pending} onClick={submit}>
          <Save className="size-4" /> Guardar
        </Button>
      </div>
    </Modal>
  );
}
