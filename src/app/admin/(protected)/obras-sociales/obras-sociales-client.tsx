"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label, FieldError } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { upsertInsuranceProvider, deleteInsuranceProvider, toggleInsuranceProviderActive } from "@/lib/actions/insurance";

type ProviderRow = { id: string; name: string; active: boolean; usageCount: number };

export function ObrasSocialesClient({ providers }: { providers: ProviderRow[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProviderRow | undefined>(undefined);
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openNew() {
    setEditing(undefined);
    setName("");
    setActive(true);
    setModalOpen(true);
  }

  function openEdit(p: ProviderRow) {
    setEditing(p);
    setName(p.name);
    setActive(p.active);
    setModalOpen(true);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await upsertInsuranceProvider({ id: editing?.id, name, active });
      if (res.error) {
        setError(res.error);
        return;
      }
      toast.success(editing ? "Obra social actualizada" : "Obra social creada");
      setModalOpen(false);
    });
  }

  async function toggle(id: string, next: boolean) {
    const res = await toggleInsuranceProviderActive(id, next);
    if (res.error) toast.error(res.error);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Obras sociales y prepagas</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Cargá acá las coberturas que atendés. Después, en cada profesional elegís si las pide al reservar y cuáles acepta.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="size-4" /> Nueva
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="size-4 text-[var(--brand)]" /> Listado
          </h2>
        </CardHeader>
        <CardBody className="p-0">
          {providers.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Todavía no cargaste ninguna. Si sólo atendés particulares, no hace falta cargar nada acá.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {providers.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 sm:px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                  </div>
                  {p.usageCount > 0 && <Badge color="slate">{p.usageCount} en uso</Badge>}
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={p.active}
                      onChange={(e) => toggle(p.id, e.target.checked)}
                      className="size-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]/30"
                    />
                    <span className="text-xs text-slate-500">{p.active ? "Activa" : "Inactiva"}</span>
                  </label>
                  <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer" title="Editar">
                    <Pencil className="size-4" />
                  </button>
                  <ConfirmButton action={() => deleteInsuranceProvider(p.id)} successText="Obra social eliminada" />
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar obra social" : "Nueva obra social"} size="sm">
        <div className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input placeholder="Ej: OSDE, PAMI, Swiss Medical..." value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="size-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]/30"
            />
            Activa
          </label>
          <FieldError>{error}</FieldError>
          <Button className="w-full" loading={pending} onClick={submit}>
            Guardar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
