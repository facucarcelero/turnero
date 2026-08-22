import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { todayStr, addDaysStr, formatDateLong } from "@/lib/time";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, initials } from "@/lib/utils";
import {
  CalendarDays,
  Users,
  Clock3,
  TrendingUp,
  ArrowRight,
  CalendarPlus,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const today = todayStr();
  const weekEnd = addDaysStr(today, 7);

  const [todayAppointments, weekCount, pendingCount, patientsCount, clinic] = await Promise.all([
    prisma.appointment.findMany({
      where: { date: today, status: { not: "CANCELLED" } },
      include: { patient: true, service: true, professional: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.appointment.count({
      where: { date: { gte: today, lt: weekEnd }, status: { not: "CANCELLED" } },
    }),
    prisma.appointment.count({ where: { status: "PENDING" } }),
    prisma.patient.count(),
    prisma.clinic.findFirst(),
  ]);

  const stats = [
    {
      label: "Turnos hoy",
      value: todayAppointments.length,
      icon: CalendarDays,
      color: "bg-teal-50 text-[var(--brand)]",
    },
    {
      label: "Próximos 7 días",
      value: weekCount,
      icon: TrendingUp,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Pendientes de confirmar",
      value: pendingCount,
      icon: Clock3,
      color: "bg-amber-50 text-amber-600",
    },
    {
      label: "Pacientes totales",
      value: patientsCount,
      icon: Users,
      color: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Hola 👋</h1>
          <p className="text-slate-500 text-sm mt-0.5">{formatDateLong(today)}</p>
        </div>
        <Link
          href="/admin/agenda"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] text-white px-4 py-2.5 text-sm font-medium hover:brightness-110 transition"
        >
          <CalendarPlus className="size-4" />
          Cargar turno
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardBody className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">{s.label}</p>
              </div>
              <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                <s.icon className="size-5" />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Agenda de hoy</h2>
          <Link href="/admin/agenda" className="text-sm text-[var(--brand)] font-medium flex items-center gap-1 hover:underline">
            Ver agenda completa <ArrowRight className="size-3.5" />
          </Link>
        </CardHeader>
        <CardBody className="p-0">
          {todayAppointments.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-sm">
              No hay turnos agendados para hoy.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {todayAppointments.map((a) => (
                <li key={a.id} className="flex items-center gap-4 px-4 sm:px-5 py-3.5">
                  <div className="text-center w-14 shrink-0">
                    <p className="text-sm font-semibold text-slate-900">{a.startTime}</p>
                    <p className="text-[11px] text-slate-400">{a.endTime}</p>
                  </div>
                  <div className="size-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600 shrink-0">
                    {initials(`${a.patient.firstName} ${a.patient.lastName}`)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {a.patient.firstName} {a.patient.lastName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {a.service.name} · {a.professional.name}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {!clinic?.logoUrl && (
        <p className="text-xs text-slate-400 text-center">
          Personalizá el nombre, logo y colores de tu clínica en{" "}
          <Link href="/admin/configuracion" className="text-[var(--brand)] hover:underline">
            Configuración
          </Link>
          .
        </p>
      )}

      {clinic && (
        <p className="text-xs text-slate-400 text-center">
          Facturación estimada del día:{" "}
          {formatCurrency(
            todayAppointments.reduce((sum, a) => sum + a.service.price, 0),
            clinic.currency
          )}
        </p>
      )}
    </div>
  );
}
