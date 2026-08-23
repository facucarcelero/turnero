import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/actions/guard";
import { MiPerfilClient } from "./mi-perfil-client";

export const dynamic = "force-dynamic";

export default async function MiPerfilPage() {
  const user = await getCurrentAdmin();
  if (!user?.professionalId) redirect("/admin");

  const professional = await prisma.professional.findUnique({ where: { id: user.professionalId } });
  if (!professional) redirect("/admin");

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Mi perfil</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Esta información se muestra en el sitio público de reservas. También podés cambiar tu contraseña de acceso.
        </p>
      </div>
      <MiPerfilClient
        professional={{
          name: professional.name,
          specialty: professional.specialty,
          bio: professional.bio,
          photoUrl: professional.photoUrl,
          color: professional.color,
        }}
        accountName={user.name}
        accountEmail={user.email}
      />
    </div>
  );
}
