"use client";

import { useState, useTransition } from "react";
import { Search, CalendarX2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input, Label } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { formatDateMedium, minutesFromNow } from "@/lib/time";
import { findAppointmentsByContact, cancelAppointmentByToken } from "@/lib/actions/appointments";

type AppointmentResult = Awaited<ReturnType<typeof findAppointmentsByContact>>[number];

export function MisTurnosClient({
  allowCancelation,
  cancelNoticeHours,
}: {
  allowCancelation: boolean;
  cancelNoticeHours: number;
}) {
  const [phone, setPhone] = useState("");
  const [dni, setDni] = useState("");
  const [results, setResults] = useState<AppointmentResult[] | null>(null);
  const [searching, startSearch] = useTransition();
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  function search() {
    if (!phone.trim()) {
      toast.error("Ingresá tu número de teléfono.");
      return;
    }
    startSearch(async () => {
      const data = await findAppointmentsByContact(phone, dni);
      setResults(data);
      if (data.length === 0) toast.info("No encontramos turnos con esos datos.");
    });
  }

  function cancel(token: string) {
    setCancelingId(token);
    cancelAppointmentByToken(token).then((res) => {
      setCancelingId(null);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Turno cancelado.");
      setResults((prev) => prev?.map((a) => (a.cancelToken === token ? { ...a, status: "CANCELLED" } : a)) ?? null);
    });
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900 mb-1">Mis turnos</h1>
      <p className="text-sm text-slate-500 mb-5">
        Buscá tus turnos con el teléfono que usaste al reservar.
      </p>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Ej: 11 2233 4455"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
            />
          </div>
          <div>
            <Label htmlFor="dni">DNI (opcional)</Label>
            <Input id="dni" value={dni} onChange={(e) => setDni(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} />
          </div>
        </div>
        <Button className="w-full mt-4" onClick={search} loading={searching}>
          <Search className="size-4" /> Buscar mis turnos
        </Button>
      </div>

      {results && (
        <div className="mt-6 space-y-3">
          {results.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-6">No encontramos turnos con esos datos.</p>
          ) : (
            results.map((a) => {
              const canCancel =
                allowCancelation &&
                (a.status === "PENDING" || a.status === "CONFIRMED") &&
                minutesFromNow(a.date, a.startTime) > cancelNoticeHours * 60;
              return (
                <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{a.service.name}</p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {formatDateMedium(a.date)} a las {a.startTime} · {a.professional.name}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                  {canCancel && (
                    <button
                      onClick={() => cancel(a.cancelToken)}
                      disabled={cancelingId === a.cancelToken}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 cursor-pointer disabled:opacity-50"
                    >
                      {cancelingId === a.cancelToken ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <CalendarX2 className="size-3.5" />
                      )}
                      Cancelar turno
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
