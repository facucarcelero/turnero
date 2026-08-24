"use client";

import { useEffect, useState, useTransition } from "react";
import { Search, CalendarX2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Input, Label } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { formatDateMedium, minutesFromNow } from "@/lib/time";
import { findAppointmentsByContact, cancelAppointmentByToken } from "@/lib/actions/appointments";

type AppointmentResult = Awaited<ReturnType<typeof findAppointmentsByContact>>[number];

const STORAGE_KEY = "turnero:mis-turnos-contacto";

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
  const [remembered, setRemembered] = useState(false);

  // Recordamos el último teléfono/DNI usado en este dispositivo para que
  // el paciente no tenga que volver a tipearlo cada vez que visita la página.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const { phone: savedPhone, dni: savedDni } = JSON.parse(saved) as { phone: string; dni: string };
      if (savedPhone || savedDni) {
        // Precarga desde localStorage: patrón habitual para hidratar estado
        // desde una fuente externa al montar (ver booking-wizard.tsx).
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPhone(savedPhone ?? "");
        setDni(savedDni ?? "");
        setRemembered(true);
        startSearch(async () => {
          const data = await findAppointmentsByContact(savedPhone, savedDni);
          setResults(data);
        });
      }
    } catch {
      // localStorage puede no estar disponible (modo privado); no es crítico.
    }
  }, []);

  function search() {
    if (!phone.trim() && !dni.trim()) {
      toast.error("Ingresá tu teléfono o tu DNI.");
      return;
    }
    startSearch(async () => {
      const data = await findAppointmentsByContact(phone, dni);
      setResults(data);
      if (data.length === 0) toast.info("No encontramos turnos con esos datos.");
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ phone: phone.trim(), dni: dni.trim() }));
        setRemembered(true);
      } catch {
        // Ignorado: sólo afecta la conveniencia de no volver a tipear los datos.
      }
    });
  }

  function forget() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // no-op
    }
    setRemembered(false);
    setPhone("");
    setDni("");
    setResults(null);
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
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 mb-1">Mis turnos</h1>
          <p className="text-sm text-slate-500">Buscá tus turnos con tu teléfono o tu DNI.</p>
        </div>
        {remembered && (
          <button
            onClick={forget}
            className="shrink-0 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 cursor-pointer mt-1"
            title="Olvidar mis datos en este dispositivo"
          >
            <X className="size-3.5" /> Olvidar
          </button>
        )}
      </div>

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
            <Label htmlFor="dni">DNI</Label>
            <Input id="dni" placeholder="Alcanza con uno de los dos" value={dni} onChange={(e) => setDni(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} />
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
              const isActive = a.status === "PENDING" || a.status === "CONFIRMED";
              const withinNotice = minutesFromNow(a.date, a.startTime) <= cancelNoticeHours * 60;
              const canCancel = allowCancelation && isActive && !withinNotice;
              const whyNot = !isActive
                ? null
                : !allowCancelation
                  ? "La cancelación online está desactivada. Contactanos directamente para cancelar este turno."
                  : withinNotice
                    ? `Ya no se puede cancelar online: faltan menos de ${cancelNoticeHours}hs para el turno. Contactanos directamente si necesitás cancelarlo.`
                    : null;
              return (
                <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">
                        {[a.service, ...a.extraServices].map((s) => s.name).join(" + ")}
                      </p>
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
                  {!canCancel && whyNot && (
                    <p className="mt-3 text-xs text-slate-400">{whyNot}</p>
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
