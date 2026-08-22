import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const clinic = await prisma.clinic.findFirst();

  // La página /admin/login no usa este layout (tiene el suyo propio, ver route group).
  if (!session?.user) {
    return <>{children}</>;
  }

  return (
    <AdminShell
      clinicName={clinic?.name ?? "Turnero"}
      userName={session.user.name ?? "Admin"}
      userRole={(session.user as { role?: string }).role ?? "STAFF"}
    >
      {children}
    </AdminShell>
  );
}
