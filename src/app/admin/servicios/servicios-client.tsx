"use client";

import { useState } from "react";
import { Plus, Pencil, Clock, Users } from "lucide-react";
import { toast } from "sonner";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { ServiceFormModal, type EditableService } from "@/components/admin/service-form-modal";
import { formatCurrency } from "@/lib/utils";
import { deleteService, toggleServiceActive } from "@/lib/actions/services";

type ServiceRow = EditableService & { appointmentsCount: number };

export function ServiciosClient({
  services,
  professionals,
}: {
  services: ServiceRow[];
  professionals: { id: string; name: string }[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditableService | undefined>(undefined);

  async function toggle(id: string, active: boolean) {
    const res = await toggleServiceActive(id, active);
    if (res.error) toast.error(res.error);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Servicios</h1>
          <p className="text-sm text-slate-500 mt-0.5">Los tipos de consulta que tus pacientes pueden reservar.</p>
        </div>
        <Button onClick={() => { setEditing(undefined); setModalOpen(true); }}>
          <Plus className="size-4" /> Nuevo servicio
        </Button>
      </div>

      {services.length === 0 ? (
        <Card><CardBody className="text-center py-12 text-slate-400 text-sm">Todavía no cargaste servicios.</CardBody></Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {services.map((s) => (
            <Card key={s.id} className={!s.active ? "opacity-60" : undefined}>
              <CardBody>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <p className="font-medium text-slate-900 truncate">{s.name}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => { setEditing(s); setModalOpen(true); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer" title="Editar">
                      <Pencil className="size-4" />
                    </button>
                    <ConfirmButton action={() => deleteService(s.id)} successText="Servicio eliminado" />
                  </div>
                </div>
                {s.description && <p className="text-sm text-slate-500 mt-2">{s.description}</p>}
                <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Clock className="size-3.5" /> {s.durationMin} min</span>
                  <span>{formatCurrency(s.price)}</span>
                  <span className="flex items-center gap-1"><Users className="size-3.5" /> {s.professionalIds.length}</span>
                </div>
                <label className="flex items-center gap-2 mt-3.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={s.active}
                    onChange={(e) => toggle(s.id, e.target.checked)}
                    className="size-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]/30"
                  />
                  <span className="text-xs text-slate-500">{s.active ? "Activo" : "Inactivo"}</span>
                  {s.appointmentsCount > 0 && <Badge className="ml-auto">{s.appointmentsCount} turnos</Badge>}
                </label>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <ServiceFormModal key={editing?.id ?? "new"} open={modalOpen} onClose={() => setModalOpen(false)} initial={editing} professionals={professionals} />
    </div>
  );
}
