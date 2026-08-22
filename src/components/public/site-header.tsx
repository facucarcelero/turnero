import Link from "next/link";
import { initials } from "@/lib/utils";

export function SiteHeader({ clinicName }: { clinicName: string }) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <div className="size-9 rounded-xl bg-[var(--brand)] flex items-center justify-center text-white font-bold text-sm shrink-0">
            {initials(clinicName)}
          </div>
          <span className="font-semibold text-slate-900 truncate">{clinicName}</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/mis-turnos"
            className="hidden sm:inline-flex text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2"
          >
            Mis turnos
          </Link>
          <Link
            href="/reservar"
            className="inline-flex items-center rounded-xl bg-[var(--brand)] text-white text-sm font-medium px-4 py-2.5 hover:brightness-110 transition"
          >
            Reservar turno
          </Link>
        </div>
      </div>
    </header>
  );
}
