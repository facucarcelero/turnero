"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/field";
import { formatCurrency } from "@/lib/utils";
import { upsertServiceCombo } from "@/lib/actions/service-combos";

export type EditableCombo = {
  id: string;
  name: string | null;
  price: number | null;
  durationMin: number | null;
  active: boolean;
  serviceIds: string[];
};

export function ServiceComboFormModal({
  open,
  onClose,
  initial,
  services,
}: {
  open: boolean;
  onClose: () => void;
  initial?: EditableCombo;
  services: { id: string; name: string; price: number; durationMin: number }[];
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    serviceIds: initial?.serviceIds ?? ([] as string[]),
    price: initial?.price?.toString() ?? "",
    durationMin: initial?.durationMin?.toString() ?? "",
    active: initial?.active ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedServices = useMemo(
    () => services.filter((s) => form.serviceIds.includes(s.id)),
    [services, form.serviceIds]
  );
  const sumPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const sumDuration = selectedServices.reduce((sum, s) => sum + s.durationMin, 0);

  function toggleService(id: string) {
    setForm((f) => ({
      ...f,
      serviceIds: f.serviceIds.includes(id) ? f.serviceIds.filter((x) => x !== id) : [...f.serviceIds, id],
    }));
  }

  function submit() {
    setError(null);
    if (form.serviceIds.length < 2) {
      setError("Elegí al menos dos servicios para combinar.");
      return;
    }
    startTransition(async () => {
      const res = await upsertServiceCombo({
        id: initial?.id,
        name: form.name,
        serviceIds: form.serviceIds,
        price: form.price.trim() ? Number(form.price) : null,
        durationMin: form.durationMin.trim() ? Number(form.durationMin) : null,
        active: form.active,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      toast.success(initial ? "Combo actualizado" : "Combo creado");
      onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Editar combo" : "Nuevo combo"} description="Definí una combinación de servicios con precio y/o duración propios.">
      <div className="space-y-4">
        <div>
          <Label>Nombre (opcional)</Label>
          <Input placeholder="Ej: Consulta + Ecografía" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <Label>Servicios combinados</Label>
          <div className="space-y-1.5">
            {services.map((s) => (
              <label key={s.id} className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.serviceIds.includes(s.id)}
                  onChange={() => toggleService(s.id)}
                  className="size-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]/30"
                />
                {s.name} <span className="text-slate-400">({s.durationMin}min · {formatCurrency(s.price)})</span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Precio combinado</Label>
            <Input
              type="number"
              min={0}
              placeholder={`Suma automática: ${formatCurrency(sumPrice)}`}
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            />
          </div>
          <div>
            <Label>Duración combinada (min)</Label>
            <Input
              type="number"
              min={5}
              step={5}
              placeholder={`Suma automática: ${sumDuration} min`}
              value={form.durationMin}
              onChange={(e) => setForm((f) => ({ ...f, durationMin: e.target.value }))}
            />
          </div>
        </div>
        <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            className="size-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]/30"
          />
          Combo activo (visible para reservar online)
        </label>
        <FieldError>{error}</FieldError>
        <Button className="w-full" size="lg" loading={pending} onClick={submit}>
          <Save className="size-4" /> Guardar
        </Button>
      </div>
    </Modal>
  );
}
