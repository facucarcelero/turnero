"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, X, Copy, Save } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { weekdayName } from "@/lib/time";
import { saveWorkingHours, type WeekSchedule } from "@/lib/actions/schedule";

type Professional = {
  id: string;
  name: string;
  color: string;
  workingHours: { weekday: number; startTime: string; endTime: string }[];
};

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0]; // Lunes primero

function toSchedule(hours: { weekday: number; startTime: string; endTime: string }[]): WeekSchedule {
  const schedule: WeekSchedule = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const h of hours) {
    schedule[h.weekday].push({ startTime: h.startTime, endTime: h.endTime });
  }
  for (const day of Object.keys(schedule)) {
    schedule[Number(day)].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
  return schedule;
}

export function HorariosClient({ professionals }: { professionals: Professional[] }) {
  const [activeId, setActiveId] = useState(professionals[0]?.id);
  const active = professionals.find((p) => p.id === activeId);

  if (!active) {
    return (
      <Card><CardBody className="text-center py-12 text-slate-400 text-sm">Creá un profesional primero en la sección Profesionales.</CardBody></Card>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Horarios</h1>
        <p className="text-sm text-slate-500 mt-0.5">Definí los horarios de atención semanales de cada profesional.</p>
      </div>

      {professionals.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {professionals.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveId(p.id)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium whitespace-nowrap border shrink-0",
                activeId === p.id ? "bg-[var(--brand)] border-[var(--brand)] text-white" : "bg-white border-slate-200 text-slate-600"
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* La key remonta el editor al cambiar de profesional, reseteando su estado sin necesitar un efecto. */}
      <ScheduleEditor key={active.id} professionalId={active.id} initialHours={active.workingHours} />
    </div>
  );
}

function ScheduleEditor({
  professionalId,
  initialHours,
}: {
  professionalId: string;
  initialHours: { weekday: number; startTime: string; endTime: string }[];
}) {
  const [schedule, setSchedule] = useState<WeekSchedule>(() => toSchedule(initialHours));
  const [pending, startTransition] = useTransition();

  function addRange(day: number) {
    setSchedule((s) => ({ ...s, [day]: [...s[day], { startTime: "09:00", endTime: "13:00" }] }));
  }
  function removeRange(day: number, idx: number) {
    setSchedule((s) => ({ ...s, [day]: s[day].filter((_, i) => i !== idx) }));
  }
  function updateRange(day: number, idx: number, field: "startTime" | "endTime", value: string) {
    setSchedule((s) => ({
      ...s,
      [day]: s[day].map((r, i) => (i === idx ? { ...r, [field]: value } : r)),
    }));
  }
  function copyToAllWeekdays(day: number) {
    setSchedule((s) => {
      const ranges = s[day];
      const next = { ...s };
      for (const d of [1, 2, 3, 4, 5]) next[d] = ranges.map((r) => ({ ...r }));
      return next;
    });
    toast.info("Copiado a los días de semana (lunes a viernes)");
  }

  function save() {
    startTransition(async () => {
      const res = await saveWorkingHours(professionalId, schedule);
      if (res.error) toast.error(res.error);
      else toast.success("Horarios guardados");
    });
  }

  return (
    <>
      <Card>
        <CardBody className="space-y-4">
          {WEEKDAYS.map((day) => {
            const ranges = schedule[day];
            const enabled = ranges.length > 0;
            return (
              <div key={day} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => (e.target.checked ? addRange(day) : setSchedule((s) => ({ ...s, [day]: [] })))}
                      className="size-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]/30"
                    />
                    <span className="font-medium text-slate-800 text-sm w-24">{weekdayName(day)}</span>
                  </label>
                  {enabled && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => addRange(day)} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer" title="Agregar franja horaria">
                        <Plus className="size-4" />
                      </button>
                      <button onClick={() => copyToAllWeekdays(day)} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer" title="Copiar a Lun-Vie">
                        <Copy className="size-4" />
                      </button>
                    </div>
                  )}
                </div>
                {enabled && (
                  <div className="mt-2.5 space-y-2 pl-6">
                    {ranges.map((r, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input type="time" value={r.startTime} onChange={(e) => updateRange(day, idx, "startTime", e.target.value)} className="w-32" />
                        <span className="text-slate-400 text-sm">a</span>
                        <Input type="time" value={r.endTime} onChange={(e) => updateRange(day, idx, "endTime", e.target.value)} className="w-32" />
                        <button onClick={() => removeRange(day, idx)} className="text-slate-300 hover:text-red-500 p-1 cursor-pointer">
                          <X className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardBody>
      </Card>

      <Button size="lg" className="w-full sm:w-auto mt-5" loading={pending} onClick={save}>
        <Save className="size-4" /> Guardar horarios
      </Button>
    </>
  );
}
