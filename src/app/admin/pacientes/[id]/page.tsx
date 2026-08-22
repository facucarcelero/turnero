import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Phone, Mail, IdCard, Cake } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/time";
import { initials, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: {
        include: { service: true, professional: true },
        orderBy: [{ date: "desc" }, { startTime: "desc" }],
      },
    },
  });

  if (!patient) notFound();

  const completed = patient.appointments.filter((a) => a.status === "COMPLETED");
  const totalSpent = completed.reduce((sum, a) => sum + a.service.price, 0);

  return (
    <div className="space-y-5">
      <Link href="/admin/pacientes" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 w-fit">
        <ChevronLeft className="size-4" /> Volver a pacientes
      </Link>

      <Card>
        <CardBody className="flex items-center gap-4">
          <div className="size-14 rounded-full bg-slate-100 flex items-center justify-center text-base font-semibold text-slate-600 shrink-0">
            {initials(`${patient.firstName} ${patient.lastName}`)}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-slate-900">{patient.firstName} {patient.lastName}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-500">
              <span className="flex items-center gap-1.5"><Phone className="size-3.5" /> {patient.phone}</span>
              {patient.email && <span className="flex items-center gap-1.5"><Mail className="size-3.5" /> {patient.email}</span>}
              {patient.dni && <span className="flex items-center gap-1.5"><IdCard className="size-3.5" /> {patient.dni}</span>}
              {patient.birthDate && <span className="flex items-center gap-1.5"><Cake className="size-3.5" /> {formatDateShort(patient.birthDate)}</span>}
            </div>
          </div>
        </CardBody>
      </Card>

      {patient.notes && (
        <Card>
          <CardHeader><h2 className="font-semibold text-slate-900 text-sm">Notas y antecedentes</h2></CardHeader>
          <CardBody className="text-sm text-slate-600 whitespace-pre-wrap">{patient.notes}</CardBody>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card><CardBody><p className="text-2xl font-semibold text-slate-900">{patient.appointments.length}</p><p className="text-xs text-slate-500 mt-1">Turnos totales</p></CardBody></Card>
        <Card><CardBody><p className="text-2xl font-semibold text-slate-900">{formatCurrency(totalSpent)}</p><p className="text-xs text-slate-500 mt-1">Facturado (atendidos)</p></CardBody></Card>
      </div>

      <Card>
        <CardHeader><h2 className="font-semibold text-slate-900 text-sm">Historial de turnos</h2></CardHeader>
        <CardBody className="p-0">
          {patient.appointments.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">Este paciente no tiene turnos registrados.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {patient.appointments.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{formatDateShort(a.date)} · {a.startTime}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{a.service.name} · {a.professional.name}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
