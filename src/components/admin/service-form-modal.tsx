"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { upsertService } from "@/lib/actions/services";

export type EditableService = {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: number;
  color: string;
  active: boolean;
  professionalIds: string[];
};

const COLORS = ["#0d9488", "#0891b2", "#7c3aed", "#db2777", "#2563eb", "#ea580c", "#16a34a", "#dc2626"];

export function ServiceFormModal({
  open,
  onClose,
  initial,
  professionals,
}: {
  open: boolean;
  onClose: () => void;
  initial?: EditableService;
  professionals: { id: string; name: string }[];
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    durationMin: initial?.durationMin ?? 30,
    price: initial?.price ?? 0,
    color: initial?.color ?? COLORS[0],
    active: initial?.active ?? true,
    professionalIds: initial?.professionalIds ?? professionals.map((p) => p.id),
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleProfessional(id: string) {
    setForm((f) => ({
      ...f,
      professionalIds: f.professionalIds.includes(id)
        ? f.professionalIds.filter((x) => x !== id)
        : [...f.professionalIds, id],
    }));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await upsertService({ id: initial?.id, ...form });
      if (res.error) {
        setError(res.error);
        return;
      }
      toast.success(initial ? "Servicio actualizado" : "Servicio creado");
      onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Editar servicio" : "Nuevo servicio"}>
      <div className="space-y-4">
        <div>
          <Label>Nombre</Label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <Label>Descripción (opcional)</Label>
          <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Duración (minutos)</Label>
            <Input type="number" min={5} step={5} value={form.durationMin} onChange={(e) => setForm((f) => ({ ...f, durationMin: Number(e.target.value) }))} />
          </div>
          <div>
            <Label>Precio</Label>
            <Input type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} />
          </div>
        </div>
        <div>
          <Label>Color</Label>
          <div className="flex gap-2 flex-wrap">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm((f) => ({ ...f, color: c }))}
                className={cn("size-8 rounded-full border-2", form.color === c ? "border-slate-900" : "border-transparent")}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <div>
          <Label>Profesionales que lo ofrecen</Label>
          <div className="space-y-1.5">
            {professionals.map((p) => (
              <label key={p.id} className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.professionalIds.includes(p.id)}
                  onChange={() => toggleProfessional(p.id)}
                  className="size-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]/30"
                />
                {p.name}
              </label>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            className="size-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]/30"
          />
          Servicio activo (visible para reservar online)
        </label>
        <FieldError>{error}</FieldError>
        <Button className="w-full" size="lg" loading={pending} onClick={submit}>
          <Save className="size-4" /> Guardar
        </Button>
      </div>
    </Modal>
  );
}
