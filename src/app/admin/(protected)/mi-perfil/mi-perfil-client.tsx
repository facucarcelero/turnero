"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Save, KeyRound } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { updateOwnProfessionalProfile, updateOwnPassword } from "@/lib/actions/profile";

const COLORS = ["#0d9488", "#0891b2", "#7c3aed", "#db2777", "#2563eb", "#ea580c", "#16a34a", "#dc2626"];

type ProfessionalProfile = {
  name: string;
  specialty: string | null;
  bio: string | null;
  photoUrl: string | null;
  color: string;
};

export function MiPerfilClient({
  professional,
  accountName,
  accountEmail,
}: {
  professional: ProfessionalProfile;
  accountName: string;
  accountEmail: string;
}) {
  const [form, setForm] = useState({
    name: professional.name,
    specialty: professional.specialty ?? "",
    bio: professional.bio ?? "",
    photoUrl: professional.photoUrl ?? "",
    color: professional.color,
  });
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profilePending, startProfileTransition] = useTransition();

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwPending, startPwTransition] = useTransition();

  function saveProfile() {
    setProfileError(null);
    startProfileTransition(async () => {
      const res = await updateOwnProfessionalProfile(form);
      if (res.error) {
        setProfileError(res.error);
        return;
      }
      toast.success("Perfil actualizado");
    });
  }

  function savePassword() {
    setPwError(null);
    if (pwForm.newPassword !== pwForm.confirm) {
      setPwError("Las contraseñas nuevas no coinciden.");
      return;
    }
    startPwTransition(async () => {
      const res = await updateOwnPassword(pwForm);
      if (res.error) {
        setPwError(res.error);
        return;
      }
      toast.success("Contraseña actualizada");
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
    });
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">Datos de la cuenta</h2>
        </CardHeader>
        <CardBody className="text-sm text-slate-600 space-y-1">
          <p><span className="text-slate-400">Nombre de usuario:</span> {accountName}</p>
          <p><span className="text-slate-400">Email de acceso:</span> {accountEmail}</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">Perfil público</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <Label>Nombre completo</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label>Especialidad</Label>
            <Input value={form.specialty} onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))} />
          </div>
          <div>
            <Label>Biografía (opcional)</Label>
            <Textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
          </div>
          <div>
            <Label>Foto (URL, opcional)</Label>
            <Input
              placeholder="https://..."
              value={form.photoUrl}
              onChange={(e) => setForm((f) => ({ ...f, photoUrl: e.target.value }))}
            />
          </div>
          <div>
            <Label>Color identificatorio</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={cn("size-8 rounded-full border-2", form.color === c ? "border-slate-900" : "border-transparent")}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <FieldError>{profileError}</FieldError>
          <Button className="w-full sm:w-auto" loading={profilePending} onClick={saveProfile}>
            <Save className="size-4" /> Guardar perfil
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-slate-900">Cambiar contraseña</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <Label>Contraseña actual</Label>
            <Input
              type="password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
            />
          </div>
          <div>
            <Label>Nueva contraseña</Label>
            <Input
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
            />
          </div>
          <div>
            <Label>Repetir nueva contraseña</Label>
            <Input
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
            />
          </div>
          <FieldError>{pwError}</FieldError>
          <Button className="w-full sm:w-auto" variant="outline" loading={pwPending} onClick={savePassword}>
            <KeyRound className="size-4" /> Actualizar contraseña
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
