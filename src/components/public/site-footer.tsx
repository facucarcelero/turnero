import { MapPin, Phone, Mail, AtSign } from "lucide-react";
import type { Clinic } from "@prisma/client";

export function SiteFooter({ clinic }: { clinic: Clinic | null }) {
  return (
    <footer className="border-t border-slate-100 bg-white mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid sm:grid-cols-2 gap-6 sm:gap-4">
          <div>
            <p className="font-semibold text-slate-900">{clinic?.name ?? "Turnero"}</p>
            <p className="text-sm text-slate-500 mt-1">{clinic?.tagline}</p>
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            {clinic?.address && (
              <p className="flex items-center gap-2">
                <MapPin className="size-4 text-slate-400 shrink-0" /> {clinic.address}
              </p>
            )}
            {clinic?.phone && (
              <p className="flex items-center gap-2">
                <Phone className="size-4 text-slate-400 shrink-0" /> {clinic.phone}
              </p>
            )}
            {clinic?.email && (
              <p className="flex items-center gap-2">
                <Mail className="size-4 text-slate-400 shrink-0" /> {clinic.email}
              </p>
            )}
            {clinic?.instagram && (
              <p className="flex items-center gap-2">
                <AtSign className="size-4 text-slate-400 shrink-0" /> {clinic.instagram}
              </p>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-8">
          © {new Date().getFullYear()} {clinic?.name ?? "Turnero"}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
