import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/actions/guard";
import { ClinicSettingsForm } from "./clinic-settings-form";
import { AdminUsersSection } from "./admin-users-section";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const currentUser = await requirePageRole("ADMIN");
  const isOwner = currentUser.role === "OWNER";

  const [clinic, users, professionals] = await Promise.all([
    prisma.clinic.findFirst(),
    isOwner ? prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } }) : Promise.resolve([]),
    isOwner ? prisma.professional.findMany({ orderBy: { order: "asc" } }) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Configuración</h1>
        <p className="text-sm text-slate-500 mt-0.5">Personalizá tu clínica y controlá quién accede al panel.</p>
      </div>
      <ClinicSettingsForm clinic={clinic} />
      {isOwner && (
        <AdminUsersSection
          users={users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            active: u.active,
            professionalId: u.professionalId,
          }))}
          professionals={professionals.map((p) => ({ id: p.id, name: p.name }))}
        />
      )}
    </div>
  );
}
