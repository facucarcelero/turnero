"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  Loader2,
  CalendarCheck2,
  Clock,
  User,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { formatDateMedium, todayStr } from "@/lib/time";
import { DayPicker } from "@/components/public/day-picker";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { createPublicAppointment } from "@/lib/actions/appointments";

type ServiceDTO = {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  price: number;
  color: string;
  professionalIds: string[];
};

type ProfessionalDTO = {
  id: string;
  name: string;
  specialty: string | null;
  color: string;
  asksInsurance: boolean;
  insuranceProviders: { id: string; name: string }[];
};

type ClinicInfo = {
  currency: string;
  maxAdvanceDays: number;
  allowCancelation: boolean;
  cancelNoticeHours: number;
};

const STEPS = ["Servicio", "Profesional", "Fecha y hora", "Tus datos", "Listo"] as const;

export function BookingWizard({
  services,
  professionals,
  clinic,
  preselectedServiceId,
}: {
  services: ServiceDTO[];
  professionals: ProfessionalDTO[];
  clinic: ClinicInfo;
  preselectedServiceId?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [serviceId, setServiceId] = useState<string | undefined>(
    preselectedServiceId && services.some((s) => s.id === preselectedServiceId)
      ? preselectedServiceId
      : undefined
  );
  const [professionalId, setProfessionalId] = useState<string | undefined>(undefined);
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState<string | undefined>(undefined);
  const [slots, setSlots] = useState<{ startTime: string; endTime: string }[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    dni: "",
    notes: "",
    insuranceProviderId: "",
    insuranceMemberNumber: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ appointmentId: string; cancelToken: string } | null>(null);

  const service = services.find((s) => s.id === serviceId);
  const professional = professionals.find((p) => p.id === professionalId);

  const availableProfessionals = useMemo(
    () => professionals.filter((p) => service?.professionalIds.includes(p.id)),
    [professionals, service]
  );

  function selectService(s: ServiceDTO) {
    setServiceId(s.id);
    const avail = professionals.filter((p) => s.professionalIds.includes(p.id));
    if (avail.length === 1) {
      setProfessionalId(avail[0].id);
      setStep(2);
    } else {
      setProfessionalId(undefined);
      setStep(1);
    }
  }

  useEffect(() => {
    if (!professionalId || !serviceId || step !== 2) return;
    let ignore = false;
    // Feedback inmediato de carga: patrón estándar de fetching en efectos (React docs).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingSlots(true);
    setTime(undefined);
    fetch(`/api/slots?professionalId=${professionalId}&serviceId=${serviceId}&date=${date}`)
      .then((r) => r.json())
      .then((data) => {
        if (!ignore) setSlots(data.slots ?? []);
      })
      .catch(() => {
        if (!ignore) setSlots([]);
      })
      .finally(() => {
        if (!ignore) setLoadingSlots(false);
      });
    return () => {
      ignore = true;
    };
  }, [professionalId, serviceId, date, step]);

  async function handleSubmit() {
    if (!serviceId || !professionalId || !date || !time) return;
    setSubmitting(true);
    setError(null);
    const res = await createPublicAppointment({
      professionalId,
      serviceId,
      date,
      startTime: time,
      ...form,
      insuranceProviderId: form.insuranceProviderId || null,
    });
    setSubmitting(false);
    if (res.error) {
      setError(res.error);
      if (res.stale) {
        setTime(undefined);
        setSlots(null);
        setStep(2);
      }
      return;
    }
    if (res.success && res.appointmentId) {
      setResult({ appointmentId: res.appointmentId, cancelToken: res.cancelToken! });
      setStep(4);
      try {
        localStorage.setItem(
          "turnero:mis-turnos-contacto",
          JSON.stringify({ phone: form.phone.trim(), dni: form.dni.trim() })
        );
      } catch {
        // Ignorado: sólo evita que el paciente tenga que volver a tipear sus datos en "Mis turnos".
      }
    }
  }

  return (
    <div>
      {step < 4 && (
        <div className="flex items-center gap-1.5 mb-6">
          {STEPS.slice(0, 4).map((s, i) => (
            <div key={s} className="flex-1">
              <div
                className={cn(
                  "h-1.5 rounded-full transition-colors",
                  i <= step ? "bg-[var(--brand)]" : "bg-slate-200"
                )}
              />
            </div>
          ))}
        </div>
      )}

      {step > 0 && step < 4 && (
        <button
          onClick={() => setStep((s) => (s === 2 && availableProfessionals.length === 1 ? 0 : s - 1))}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4 cursor-pointer"
        >
          <ChevronLeft className="size-4" /> Volver
        </button>
      )}

      {/* Step 0: servicio */}
      {step === 0 && (
        <div className="animate-fade-in">
          <h1 className="text-xl font-semibold text-slate-900 mb-1">¿Qué servicio necesitás?</h1>
          <p className="text-sm text-slate-500 mb-5">Elegí el tipo de consulta para ver los horarios disponibles.</p>
          <div className="space-y-2.5">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => selectService(s)}
                className={cn(
                  "w-full text-left rounded-2xl border bg-white p-4 flex items-center justify-between transition hover:border-[var(--brand)]",
                  serviceId === s.id ? "border-[var(--brand)] ring-2 ring-[var(--brand)]/15" : "border-slate-200"
                )}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="size-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: s.color }} />
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{s.name}</p>
                    {s.description && <p className="text-sm text-slate-500 mt-0.5 truncate">{s.description}</p>}
                    <p className="text-xs text-slate-400 mt-1">{s.durationMin} min · {formatCurrency(s.price, clinic.currency)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: profesional */}
      {step === 1 && service && (
        <div className="animate-fade-in">
          <h1 className="text-xl font-semibold text-slate-900 mb-1">¿Con quién preferís atenderte?</h1>
          <p className="text-sm text-slate-500 mb-5">Para {service.name.toLowerCase()}.</p>
          <div className="space-y-2.5">
            {availableProfessionals.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setProfessionalId(p.id);
                  setStep(2);
                }}
                className={cn(
                  "w-full text-left rounded-2xl border bg-white p-4 flex items-center gap-3 transition hover:border-[var(--brand)]",
                  professionalId === p.id ? "border-[var(--brand)] ring-2 ring-[var(--brand)]/15" : "border-slate-200"
                )}
              >
                <div
                  className="size-11 rounded-full flex items-center justify-center text-white font-semibold shrink-0"
                  style={{ backgroundColor: p.color }}
                >
                  {p.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{p.name}</p>
                  {p.specialty && <p className="text-sm text-slate-500">{p.specialty}</p>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: fecha y hora */}
      {step === 2 && service && professional && (
        <div className="animate-fade-in">
          <h1 className="text-xl font-semibold text-slate-900 mb-1">Elegí día y horario</h1>
          <p className="text-sm text-slate-500 mb-5">
            {service.name} con {professional.name}
          </p>
          <DayPicker value={date} onChange={setDate} maxAdvanceDays={clinic.maxAdvanceDays} />

          <div className="mt-5">
            <p className="text-sm font-medium text-slate-700 mb-2.5">{formatDateMedium(date)}</p>
            {loadingSlots ? (
              <div className="flex items-center justify-center py-10 text-slate-400">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : !slots || slots.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                No hay horarios disponibles este día. Probá con otra fecha.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map((s) => (
                  <button
                    key={s.startTime}
                    onClick={() => setTime(s.startTime)}
                    className={cn(
                      "rounded-xl border py-2.5 text-sm font-medium transition",
                      time === s.startTime
                        ? "bg-[var(--brand)] border-[var(--brand)] text-white"
                        : "bg-white border-slate-200 text-slate-700 hover:border-[var(--brand)]"
                    )}
                  >
                    {s.startTime}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            className="w-full mt-6"
            size="lg"
            disabled={!time}
            onClick={() => setStep(3)}
          >
            Continuar
          </Button>
        </div>
      )}

      {/* Step 3: datos del paciente */}
      {step === 3 && service && professional && time && (
        <div className="animate-fade-in">
          <h1 className="text-xl font-semibold text-slate-900 mb-1">Tus datos</h1>
          <p className="text-sm text-slate-500 mb-5">Los usamos para confirmar y recordarte el turno.</p>

          <div className="rounded-2xl bg-teal-50/60 border border-teal-100 p-3.5 mb-5 flex items-center gap-3 text-sm text-slate-700">
            <CalendarCheck2 className="size-4 text-[var(--brand)] shrink-0" />
            <span>
              {formatDateMedium(date)} a las {time} · {service.name}
            </span>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  required
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  required
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="phone">Teléfono / WhatsApp</Label>
              <Input
                id="phone"
                required
                type="tel"
                placeholder="Ej: 11 2233 4455"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            {professional.asksInsurance && professional.insuranceProviders.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <Label htmlFor="insuranceProviderId">Obra social / prepaga</Label>
                  <Select
                    id="insuranceProviderId"
                    value={form.insuranceProviderId}
                    onChange={(e) => setForm((f) => ({ ...f, insuranceProviderId: e.target.value }))}
                  >
                    <option value="">Particular / sin cobertura</option>
                    {professional.insuranceProviders.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Select>
                </div>
                {form.insuranceProviderId && (
                  <div>
                    <Label htmlFor="insuranceMemberNumber">N° de afiliado</Label>
                    <Input
                      id="insuranceMemberNumber"
                      value={form.insuranceMemberNumber}
                      onChange={(e) => setForm((f) => ({ ...f, insuranceMemberNumber: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <Label htmlFor="dni">DNI (opcional)</Label>
                <Input
                  id="dni"
                  value={form.dni}
                  onChange={(e) => setForm((f) => ({ ...f, dni: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="email">Email (opcional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="notes">Motivo de consulta (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Contanos brevemente el motivo de tu consulta"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>

            <FieldError>{error}</FieldError>

            <Button type="submit" className="w-full mt-5" size="lg" loading={submitting}>
              Confirmar turno
            </Button>
          </form>
        </div>
      )}

      {/* Step 4: confirmación */}
      {step === 4 && result && service && professional && (
        <div className="animate-fade-in text-center py-6">
          <div className="size-16 rounded-full bg-teal-50 text-[var(--brand)] flex items-center justify-center mx-auto mb-5">
            <Check className="size-8" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">¡Turno reservado!</h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Te esperamos. Guardá este comprobante o el enlace que te enviamos.
          </p>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 mt-6 text-left space-y-3">
            <div className="flex items-center gap-3">
              <CalendarCheck2 className="size-4 text-slate-400" />
              <span className="text-sm text-slate-700">{formatDateMedium(date)}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="size-4 text-slate-400" />
              <span className="text-sm text-slate-700">{time} hs · {service.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <User className="size-4 text-slate-400" />
              <span className="text-sm text-slate-700">{professional.name}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 mt-6">
            <Button onClick={() => router.push("/")} className="w-full" size="lg">
              Volver al inicio
            </Button>
            {clinic.allowCancelation && (
              <Button
                onClick={() => router.push("/mis-turnos")}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Ver mis turnos
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
