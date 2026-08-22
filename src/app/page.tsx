import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { formatCurrency } from "@/lib/utils";
import {
  CalendarCheck,
  ShieldCheck,
  Smartphone,
  Clock,
  MessageCircle,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [clinic, services, professionals] = await Promise.all([
    prisma.clinic.findFirst(),
    prisma.service.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
    prisma.professional.findMany({ where: { active: true }, orderBy: { order: "asc" } }),
  ]);

  const name = clinic?.name ?? "Turnero";

  return (
    <>
      <SiteHeader clinicName={name} />
      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-12 sm:pb-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 text-[var(--brand)] text-xs font-semibold px-3 py-1.5">
              <CalendarCheck className="size-3.5" /> Turnos online 24hs
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mt-4 leading-tight text-balance">
              {clinic?.tagline || "Reservá tu consulta en simples pasos"}
            </h1>
            <p className="text-slate-500 mt-4 text-base sm:text-lg text-pretty">
              {clinic?.welcomeMessage ?? "Elegí el servicio, el día y el horario que más te convenga. Sin llamadas ni esperas."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-7">
              <Link
                href="/reservar"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] text-white font-medium px-6 py-3.5 hover:brightness-110 transition shadow-lg shadow-[var(--brand)]/20"
              >
                Reservar turno ahora <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/mis-turnos"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 text-slate-700 font-medium px-6 py-3.5 hover:bg-slate-50 transition"
              >
                Ver / cancelar mi turno
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12">
            {[
              { icon: Clock, title: "Reservá cuando quieras", desc: "Disponible las 24 horas, todos los días." },
              { icon: Smartphone, title: "100% desde tu celular", desc: "Pensado para reservar en segundos." },
              { icon: ShieldCheck, title: "Confirmación al instante", desc: "Recibí la confirmación de tu turno al momento." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                <f.icon className="size-6 text-[var(--brand)] mb-3" />
                <p className="font-medium text-slate-900 text-sm">{f.title}</p>
                <p className="text-sm text-slate-500 mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Professionals */}
        {professionals.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Nuestros profesionales</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {professionals.map((p) => (
                <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center gap-4">
                  <div
                    className="size-14 rounded-full flex items-center justify-center text-white font-semibold text-lg shrink-0"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{p.name}</p>
                    {p.specialty && <p className="text-sm text-[var(--brand)]">{p.specialty}</p>}
                    {p.bio && <p className="text-sm text-slate-500 mt-1">{p.bio}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Services */}
        {services.length > 0 && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-16">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Servicios disponibles</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {services.map((s) => (
                <Link
                  href={`/reservar?servicio=${s.id}`}
                  key={s.id}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between hover:border-[var(--brand)] transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.durationMin} min · {formatCurrency(s.price, clinic?.currency)}</p>
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-slate-300 group-hover:text-[var(--brand)] shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {clinic?.whatsapp && (
          <a
            href={`https://wa.me/${clinic.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-green-500 text-white px-4 py-3 shadow-lg shadow-green-500/30 hover:brightness-105 transition text-sm font-medium"
          >
            <MessageCircle className="size-5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        )}
      </main>
      <SiteFooter clinic={clinic} />
    </>
  );
}
