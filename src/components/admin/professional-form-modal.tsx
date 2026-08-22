"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { upsertProfessional } from "@/lib/actions/professionals";

export type EditableProfessional = {
  id: string;
  name: string;
  specialty: string | null;
  bio: string | null;
  color: string;
  active: boolean;
};

const COLORS = ["#0d9488", "#0891b2", "#7c3aed", "#db2777", "#2563eb", "#ea580c", "#16a34a", "#dc2626"];

export function ProfessionalFormModal({
  open,
  onClose,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  initial?: EditableProfessional;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    specialty: initial?.specialty ?? "",
    bio: initial?.bio ?? "",
    color: initial?.color ?? COLORS[0],
    active: initial?.active ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await upsertProfessional({ id: initial?.id, ...form });
      if (res.error) {
        setError(res.error);
        return;
      }
      toast.success(initial ? "Profesional actualizado" : "Profesional creado");
      onClose();
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Editar profesional" : "Nuevo profesional"}>
      <div className="space-y-4">
        <div>
          <Label>Nombre completo</Label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <Label>Especialidad</Label>
          <Input value={form.specialty} onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))} />
        </div>
        <div>
          <Label>Biografía (opcional)</Label>
          <Textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
        </div>
        <div>
          <Label>Color identificatorio</Label>
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
        <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            className="size-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]/30"
          />
          Profesional activo
        </label>
        <FieldError>{error}</FieldError>
        <Button className="w-full" size="lg" loading={pending} onClick={submit}>
          <Save className="size-4" /> Guardar
        </Button>
      </div>
    </Modal>
  );
}
