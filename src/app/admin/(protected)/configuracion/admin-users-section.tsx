"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Select, FieldError } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { initials } from "@/lib/utils";
import { upsertAdminUser, deleteAdminUser } from "@/lib/actions/clinic";

type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "STAFF";
  active: boolean;
  professionalId: string | null;
};

type ProfessionalOption = { id: string; name: string };

const ROLE_LABEL: Record<string, string> = { OWNER: "Dueño/a", ADMIN: "Administrador", STAFF: "Staff" };

export function AdminUsersSection({ users, professionals }: { users: AdminUserRow[]; professionals: ProfessionalOption[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUserRow | undefined>(undefined);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STAFF" as const, active: true, professionalId: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const linkedIds = new Set(users.filter((u) => u.professionalId).map((u) => u.professionalId));
  const availableProfessionals = professionals.filter(
    (p) => !linkedIds.has(p.id) || p.id === editing?.professionalId
  );

  function openNew() {
    setEditing(undefined);
    setForm({ name: "", email: "", password: "", role: "STAFF", active: true, professionalId: "" });
    setModalOpen(true);
  }

  function openEdit(u: AdminUserRow) {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: "", role: u.role as "STAFF", active: u.active, professionalId: u.professionalId ?? "" });
    setModalOpen(true);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await upsertAdminUser({ id: editing?.id, ...form, professionalId: form.professionalId || null });
      if (res.error) {
        setError(res.error);
        return;
      }
      toast.success(editing ? "Usuario actualizado" : "Usuario creado");
      setModalOpen(false);
    });
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Usuarios del panel</h2>
        <Button size="sm" onClick={openNew}>
          <Plus className="size-4" /> Nuevo usuario
        </Button>
      </CardHeader>
      <CardBody className="p-0">
        <ul className="divide-y divide-slate-100">
          {users.map((u) => (
            <li key={u.id} className="flex items-center gap-3 px-4 sm:px-5 py-3.5">
              <div className="size-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600 shrink-0">
                {initials(u.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 truncate">{u.name}</p>
                <p className="text-xs text-slate-500 truncate">{u.email}</p>
                {u.professionalId && (
                  <p className="text-xs text-[var(--brand)] truncate mt-0.5">
                    {professionals.find((p) => p.id === u.professionalId)?.name ?? "Profesional vinculado"}
                  </p>
                )}
              </div>
              <Badge color={u.role === "OWNER" ? "teal" : "slate"}>{ROLE_LABEL[u.role]}</Badge>
              <button onClick={() => openEdit(u)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer" title="Editar">
                <Pencil className="size-4" />
              </button>
              <ConfirmButton action={() => deleteAdminUser(u.id)} successText="Usuario eliminado" />
            </li>
          ))}
        </ul>
      </CardBody>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar usuario" : "Nuevo usuario"} size="sm">
        <div className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <Label>{editing ? "Nueva contraseña (opcional)" : "Contraseña"}</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          </div>
          <div>
            <Label>Rol</Label>
            <Select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as "STAFF" }))}>
              <option value="STAFF">Staff (agenda y turnos)</option>
              <option value="ADMIN">Administrador</option>
              <option value="OWNER">Dueño/a (control total)</option>
            </Select>
          </div>
          <div>
            <Label>Vincular a un profesional (opcional)</Label>
            <Select
              value={form.professionalId}
              onChange={(e) => setForm((f) => ({ ...f, professionalId: e.target.value }))}
            >
              <option value="">Sin vincular</option>
              {availableProfessionals.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
            <p className="text-xs text-slate-400 mt-1.5">
              Si lo vinculás, esa persona podrá entrar con su propio usuario a editar su perfil, su horario y ver únicamente su propia agenda.
            </p>
          </div>
          <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              className="size-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]/30"
            />
            Usuario activo
          </label>
          <FieldError>{error}</FieldError>
          <Button className="w-full" loading={pending} onClick={submit}>
            Guardar
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
