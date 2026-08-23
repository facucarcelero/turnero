import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";
import { getNavItems } from "@/components/admin/nav-items";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const clinic = await prisma.clinic.findFirst();

  // La página /admin/login no usa este layout (tiene el suyo propio, ver route group).
  if (!session?.user) {
    return <>{children}</>;
  }

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
