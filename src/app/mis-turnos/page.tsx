import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter } from "@/components/public/site-footer";
import { MisTurnosClient } from "./mis-turnos-client";

export const dynamic = "force-dynamic";

export default async function MisTurnosPage() {
  const clinic = await prisma.clinic.findFirst();

  return (
    <>
      <SiteHeader clinicName={clinic?.name ?? "Turnero"} />
      <main className="flex-1 bg-slate-50">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <MisTurnosClient allowCancelation={clinic?.allowCancelation ?? true} cancelNoticeHours={clinic?.cancelNoticeHours ?? 24} />
        </div>
      </main>
      <SiteFooter clinic={clinic} />
    </>
  );
}
