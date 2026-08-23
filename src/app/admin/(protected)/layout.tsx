import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { getNavItems } from "@/components/admin/nav-items";

// Todas las páginas bajo (protected) requieren sesión. Antes esto lo
// resolvía src/proxy.ts (middleware), pero Next.js 16 corre el proxy en un
// runtime que el plugin de Netlify todavía no soporta del todo bien, lo que
// rompía el login en producción. Se reemplaza por un chequeo server-side acá
// (recomendado por los propios docs de Next.js: evitar depender de
// middleware cuando hay una alternativa).
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const clinic = await prisma.clinic.findFirst();
  const role = (session.user as { role?: string }).role ?? "STAFF";
  const professionalId = (session.user as { professionalId?: string | null }).professionalId ?? null;

  return (
    <AdminShell
      clinicName={clinic?.name ?? "Turnero"}
      userName={session.user.name ?? "Admin"}
      userRole={role}
      navItems={getNavItems(role, !!professionalId)}
    >
      {children}
    </AdminShell>
  );
}
