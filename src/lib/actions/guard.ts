import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { AdminRole } from "@prisma/client";

const RANK: Record<AdminRole, number> = { STAFF: 0, ADMIN: 1, OWNER: 2 };

export type CurrentAdmin = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  professionalId: string | null;
};

/**
 * Devuelve el usuario del panel logueado, o null si no hay sesión.
 * Server actions confían en esto (no en la UI) para decidir permisos:
 * las Server Actions de Next.js son endpoints invocables directamente,
 * así que ocultar un botón en el cliente no alcanza para protegerlas.
 */
export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user as { id?: string; name?: string | null; email?: string | null; role?: AdminRole; professionalId?: string | null };
  if (!user.id || !user.role) return null;
  return {
    id: user.id,
    name: user.name ?? "",
    email: user.email ?? "",
    role: user.role,
    professionalId: user.professionalId ?? null,
  };
}

/**
 * Exige una sesión con rol de al menos `min`. Lanza si no se cumple:
 * las server actions ya devuelven { error } en sus catch/try, así que
 * quien la llame debe envolverla o dejar que el error suba al toast.
 */
export async function requireRole(min: AdminRole): Promise<CurrentAdmin> {
  const user = await getCurrentAdmin();
  if (!user || RANK[user.role] < RANK[min]) {
    throw new Error("No tenés permisos para realizar esta acción.");
  }
  return user;
}

/**
 * Igual que requireRole pero para Server Components: en vez de lanzar,
 * redirige a /admin (evita que STAFF/profesionales accedan tecleando
 * la URL de una sección que su rol no debería ver).
 */
export async function requirePageRole(min: AdminRole): Promise<CurrentAdmin> {
  const user = await getCurrentAdmin();
  if (!user || RANK[user.role] < RANK[min]) {
    redirect("/admin");
  }
  return user;
}
