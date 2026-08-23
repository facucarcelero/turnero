"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, CalendarOff } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Select, FieldError } from "@/components/ui/field";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { formatDateLong, todayStr } from "@/lib/time";
import { createBlockedSlot, deleteBlockedSlot } from "@/lib/actions/schedule";

type BlockedSlot = {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  professionalId: string | null;
  professionalName: string | null;
};

export function BloqueosClient({
  blockedSlots,
  professionals,
  restrictToProfessionalId,
}: {
  blockedSlots: BlockedSlot[];
  professionals: { id: string; name: string }[];
  restrictToProfessionalId?: string | null;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [wholeDay, setWholeDay] = useState(true);
  const [form, setForm] = useState({
    professionalId: restrictToProfessionalId ?? "",
    date: todayStr(),
    startTime: "09:00",
    endTime: "13:00",
    reason: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createBlockedSlot({
        professionalId: form.professionalId || null,
        date: form.date,
        startTime: wholeDay ? undefined : form.startTime,
        endTime: wholeDay ? undefined : form.endTime,
        reason: form.reason,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      toast.success("Bloqueo creado");
      setModalOpen(false);
      setForm({ professionalId: restrictToProfessionalId ?? "", date: todayStr(), startTime: "09:00", endTime: "13:00", reason: "" });
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Bloqueos y feriados</h1>
          <p className="text-sm text-slate-500 mt-0.5">Días u horarios en que no se puede reservar.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="size-4" /> Nuevo bloqueo
        </Button>
      </div>

      {blockedSlots.length === 0 ? (
        <Card><CardBody className="text-center py-12 text-slate-400 text-sm">No hay bloqueos próximos cargados.</CardBody></Card>
      ) : (
        <div className="space-y-2">
          {blockedSlots.map((b) => (
            <Card key={b.id}>
              <CardBody className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                  <CalendarOff className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{formatDateLong(b.date)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {b.startTime ? `${b.startTime} a ${b.endTime}` : "Todo el día"} ·{" "}
                    {b.professionalName ?? "Toda la clínica"}
                    {b.reason && ` · ${b.reason}`}
                  </p>
                </div>
                {(!restrictToProfessionalId || b.professionalId === restrictToProfessionalId) && (
                  <ConfirmButton action={() => deleteBlockedSlot(b.id)} successText="Bloqueo eliminado" />
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo bloqueo" description="Bloqueá un día completo o un rango horario puntual.">
        <div className="space-y-4">
          {restrictToProfessionalId ? (
            <div>
              <Label>Profesional</Label>
              <p className="text-sm text-slate-600">
                {professionals.find((p) => p.id === restrictToProfessionalId)?.name} (tu propia agenda)
              </p>
            </div>
          ) : (
            <div>
              <Label>Profesional</Label>
              <Select value={form.professionalId} onChange={(e) => setForm((f) => ({ ...f, professionalId: e.target.value }))}>
                <option value="">Toda la clínica</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </div>
          )}
          <div>
            <Label>Fecha</Label>
            <Input type="date" min={todayStr()} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={wholeDay} onChange={(e) => setWholeDay(e.target.checked)} className="size-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]/30" />
            Bloquear el día completo
          </label>
          {!wholeDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Desde</Label>
                <Input type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
              </div>
              <div>
                <Label>Hasta</Label>
                <Input type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} />
              </div>
            </div>
          )}
          <div>
            <Label>Motivo (opcional)</Label>
            <Input placeholder="Ej: Feriado, vacaciones, congreso..." value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
          </div>
          <FieldError>{error}</FieldError>
          <Button className="w-full" size="lg" loading={pending} onClick={submit}>
            Crear bloqueo
          </Button>
        </div>
      </Modal>
    </div>
  );
}
