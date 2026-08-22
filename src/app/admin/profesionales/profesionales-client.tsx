"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Clock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { ProfessionalFormModal, type EditableProfessional } from "@/components/admin/professional-form-modal";
import { toggleProfessionalActive, deleteProfessional } from "@/lib/actions/professionals";

type ProfessionalRow = EditableProfessional & { appointmentsCount: number };

export function ProfesionalesClient({ professionals }: { professionals: ProfessionalRow[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditableProfessional | undefined>(undefined);

  async function toggle(id: string, active: boolean) {
    const res = await toggleProfessionalActive(id, active);
    if (res.error) toast.error(res.error);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Profesionales</h1>
          <p className="text-sm text-slate-500 mt-0.5">Médicos y especialistas que atienden en la clínica.</p>
        </div>
        <Button onClick={() => { setEditing(undefined); setModalOpen(true); }}>
          <Plus className="size-4" /> Nuevo profesional
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {professionals.map((p) => (
          <Card key={p.id} className={!p.active ? "opacity-60" : undefined}>
            <CardBody className="flex items-start gap-3">
              <div className="size-11 rounded-full flex items-center justify-center text-white font-semibold shrink-0" style={{ backgroundColor: p.color }}>
                {p.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{p.name}</p>
                {p.specialty && <p className="text-sm text-[var(--brand)]">{p.specialty}</p>}
                {p.bio && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.bio}</p>}
                <div className="flex items-center gap-3 mt-3">
                  <Link href="/admin/horarios" className="text-xs text-slate-500 flex items-center gap-1 hover:text-slate-800">
                    <Clock className="size-3.5" /> Ver horarios
                  </Link>
                  <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
                    <input
                      type="checkbox"
                      checked={p.active}
                      onChange={(e) => toggle(p.id, e.target.checked)}
                      className="size-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]/30"
                    />
                    <span className="text-xs text-slate-500">{p.active ? "Activo" : "Inactivo"}</span>
                  </label>
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button onClick={() => { setEditing(p); setModalOpen(true); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer" title="Editar">
                  <Pencil className="size-4" />
                </button>
                <ConfirmButton action={() => deleteProfessional(p.id)} successText="Profesional eliminado" />
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <ProfessionalFormModal key={editing?.id ?? "new"} open={modalOpen} onClose={() => setModalOpen(false)} initial={editing} />
    </div>
  );
}
