"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { updateClinicSettings } from "@/lib/actions/clinic";
import type { Clinic } from "@prisma/client";

const COLORS = ["#0d9488", "#0891b2", "#7c3aed", "#db2777", "#2563eb", "#ea580c", "#16a34a", "#dc2626", "#4f46e5"];

export function ClinicSettingsForm({ clinic }: { clinic: Clinic | null }) {
  const [form, setForm] = useState({
    name: clinic?.name ?? "",
    tagline: clinic?.tagline ?? "",
    logoUrl: clinic?.logoUrl ?? "",
    primaryColor: clinic?.primaryColor ?? COLORS[0],
    address: clinic?.address ?? "",
    phone: clinic?.phone ?? "",
    whatsapp: clinic?.whatsapp ?? "",
    email: clinic?.email ?? "",
    instagram: clinic?.instagram ?? "",
    slotDurationMin: clinic?.slotDurationMin ?? 30,
    minNoticeHours: clinic?.minNoticeHours ?? 2,
    maxAdvanceDays: clinic?.maxAdvanceDays ?? 60,
    allowCancelation: clinic?.allowCancelation ?? true,
    cancelNoticeHours: clinic?.cancelNoticeHours ?? 24,
    currency: clinic?.currency ?? "ARS",
    welcomeMessage: clinic?.welcomeMessage ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await updateClinicSettings(form);
      if (res.error) {
        setError(res.error);
        return;
      }
      toast.success("Configuración guardada. Los cambios ya están activos.");
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><h2 className="font-semibold text-slate-900">Datos de la clínica</h2></CardHeader>
        <CardBody className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label>Frase / eslogan</Label>
            <Input value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} />
          </div>
          <div>
            <Label>Mensaje de bienvenida (portada)</Label>
            <Textarea value={form.welcomeMessage} onChange={(e) => setForm((f) => ({ ...f, welcomeMessage: e.target.value }))} />
          </div>
          <div>
            <Label>Color de marca</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, primaryColor: c }))}
                  className={cn("size-8 rounded-full border-2", form.primaryColor === c ? "border-slate-900" : "border-transparent")}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <Label>URL del logo (opcional)</Label>
            <Input placeholder="https://..." value={form.logoUrl} onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold text-slate-900">Contacto</h2></CardHeader>
        <CardBody className="space-y-4">
          <div>
            <Label>Dirección</Label>
            <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Teléfono</Label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <Label>WhatsApp (solo números)</Label>
              <Input placeholder="5491122334455" value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <Label>Instagram</Label>
              <Input placeholder="@usuario" value={form.instagram} onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))} />
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold text-slate-900">Reglas de reserva online</h2></CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Duración de cada franja (min)</Label>
              <Input type="number" min={5} step={5} value={form.slotDurationMin} onChange={(e) => setForm((f) => ({ ...f, slotDurationMin: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>Anticipación mínima (horas)</Label>
              <Input type="number" min={0} value={form.minNoticeHours} onChange={(e) => setForm((f) => ({ ...f, minNoticeHours: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Reservar hasta (días a futuro)</Label>
              <Input type="number" min={1} value={form.maxAdvanceDays} onChange={(e) => setForm((f) => ({ ...f, maxAdvanceDays: Number(e.target.value) }))} />
            </div>
            <div>
              <Label>Moneda</Label>
              <Input value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} />
            </div>
          </div>
          <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.allowCancelation}
              onChange={(e) => setForm((f) => ({ ...f, allowCancelation: e.target.checked }))}
              className="size-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]/30"
            />
            Permitir que los pacientes cancelen sus turnos online
          </label>
          {form.allowCancelation && (
            <div>
              <Label>Anticipación mínima para cancelar (horas)</Label>
              <Input type="number" min={0} value={form.cancelNoticeHours} onChange={(e) => setForm((f) => ({ ...f, cancelNoticeHours: Number(e.target.value) }))} />
            </div>
          )}
        </CardBody>
      </Card>

      <FieldError>{error}</FieldError>

      <Button size="lg" loading={pending} onClick={submit}>
        <Save className="size-4" /> Guardar configuración
      </Button>
    </div>
  );
}
