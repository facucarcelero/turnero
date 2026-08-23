"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Pencil, Phone, ChevronRight } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { PatientFormModal, type EditablePatient } from "@/components/admin/patient-form-modal";
import { initials } from "@/lib/utils";
import { deletePatient } from "@/lib/actions/patients";

type PatientRow = EditablePatient & { appointmentsCount: number; insuranceProviderName: string | null };

export function PacientesClient({
  patients,
  insuranceProviders,
}: {
  patients: PatientRow[];
  insuranceProviders: { id: string; name: string }[];
}) {
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditablePatient | undefined>(undefined);

  const filtered = useMemo(() => {
    if (!query.trim()) return patients;
    const q = query.toLowerCase();
    return patients.filter(
      (p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.dni?.includes(q) ||
        p.email?.toLowerCase().includes(q)
    );
  }, [query, patients]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Pacientes</h1>
          <p className="text-sm text-slate-500 mt-0.5">{patients.length} paciente(s) registrados</p>
        </div>
        <Button onClick={() => { setEditing(undefined); setModalOpen(true); }}>
          <Plus className="size-4" /> Nuevo paciente
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input className="pl-10" placeholder="Buscar por nombre, teléfono, DNI o email..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <Card><CardBody className="text-center py-12 text-slate-400 text-sm">No se encontraron pacientes.</CardBody></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <Card key={p.id}>
              <CardBody className="flex items-center gap-3">
                <Link href={`/admin/pacientes/${p.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600 shrink-0">
                    {initials(`${p.firstName} ${p.lastName}`)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate">{p.firstName} {p.lastName}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="size-3" /> {p.phone} {p.dni && `· DNI ${p.dni}`}
                    </p>
                  </div>
                </Link>
                {p.insuranceProviderName && <Badge color="blue">{p.insuranceProviderName}</Badge>}
                <span className="text-xs text-slate-400 hidden sm:inline shrink-0">{p.appointmentsCount} turno(s)</span>
                <button onClick={() => { setEditing(p); setModalOpen(true); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer shrink-0" title="Editar">
                  <Pencil className="size-4" />
                </button>
                <ConfirmButton action={() => deletePatient(p.id)} successText="Paciente eliminado" />
                <Link href={`/admin/pacientes/${p.id}`} className="text-slate-300 shrink-0">
                  <ChevronRight className="size-4" />
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <PatientFormModal
        key={editing?.id ?? "new"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        insuranceProviders={insuranceProviders}
      />
    </div>
  );
}
