import { prisma } from "@/lib/prisma";
import { ClinicSettingsForm } from "./clinic-settings-form";
import { AdminUsersSection } from "./admin-users-section";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const [clinic, users] = await Promise.all([
    prisma.clinic.findFirst(),
    prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Configuración</h1>
        <p className="text-sm text-slate-500 mt-0.5">Personalizá tu clínica y controlá quién accede al panel.</p>
      </div>
      <ClinicSettingsForm clinic={clinic} />
      <AdminUsersSection
        users={users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, active: u.active }))}
      />
    </div>
  );
}
