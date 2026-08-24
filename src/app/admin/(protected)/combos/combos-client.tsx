"use client";

import { useState } from "react";
import { Plus, Pencil, Clock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { ServiceComboFormModal, type EditableCombo } from "@/components/admin/service-combo-form-modal";
import { formatCurrency } from "@/lib/utils";
import { deleteServiceCombo, toggleServiceComboActive } from "@/lib/actions/service-combos";

type ComboRow = EditableCombo & { appointmentsCount: number };

export function CombosClient({
  combos,
  services,
}: {
  combos: ComboRow[];
  services: { id: string; name: string; price: number; durationMin: number }[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditableCombo | undefined>(undefined);

  async function toggle(id: string, active: boolean) {
    const res = await toggleServiceComboActive(id, active);
    if (res.error) toast.error(res.error);
  }

  function serviceNames(ids: string[]) {
    return ids.map((id) => services.find((s) => s.id === id)?.name ?? "?").join(" + ");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Combos de servicios</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Combinaciones de servicios que un paciente puede reservar juntas, con precio y/o duración propios.
          </p>
        </div>
        <Button onClick={() => { setEditing(undefined); setModalOpen(true); }} disabled={services.length < 2}>
          <Plus className="size-4" /> Nuevo combo
        </Button>
      </div>

      {services.length < 2 ? (
        <Card><CardBody className="text-center py-12 text-slate-400 text-sm">Necesitás al menos dos servicios activos para armar un combo.</CardBody></Card>
      ) : combos.length === 0 ? (
        <Card><CardBody className="text-center py-12 text-slate-400 text-sm">Todavía no cargaste combos.</CardBody></Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {combos.map((c) => (
            <Card key={c.id} className={!c.active ? "opacity-60" : undefined}>
              <CardBody>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{c.name || serviceNames(c.serviceIds)}</p>
                    {c.name && <p className="text-xs text-slate-500 mt-0.5 truncate">{serviceNames(c.serviceIds)}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => { setEditing(c); setModalOpen(true); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer" title="Editar">
                      <Pencil className="size-4" />
                    </button>
                    <ConfirmButton action={() => deleteServiceCombo(c.id)} successText="Combo eliminado" />
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
                  {c.durationMin != null && <span className="flex items-center gap-1"><Clock className="size-3.5" /> {c.durationMin} min</span>}
                  {c.price != null && <span>{formatCurrency(c.price)}</span>}
                  {c.price == null && c.durationMin == null && <span className="text-slate-400">Suma automática de precio y duración</span>}
                </div>
                <label className="flex items-center gap-2 mt-3.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={c.active}
                    onChange={(e) => toggle(c.id, e.target.checked)}
                    className="size-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]/30"
                  />
                  <span className="text-xs text-slate-500">{c.active ? "Activo" : "Inactivo"}</span>
                  {c.appointmentsCount > 0 && <Badge className="ml-auto">{c.appointmentsCount} turnos</Badge>}
                </label>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <ServiceComboFormModal key={editing?.id ?? "new"} open={modalOpen} onClose={() => setModalOpen(false)} initial={editing} services={services} />
    </div>
  );
}
