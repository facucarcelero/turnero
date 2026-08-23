import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Página temporal de uso único: aplica la migración de professionalId que
// quedó pendiente en producción (no hay acceso de terminal a la base) y
// deja creadas/reseteadas las cuentas de prueba pedidas. Protegida por una
// clave fija en la URL. Se borra apenas confirmemos que funcionó.
const SETUP_KEY = "5221de92acefb460d886cf872b35134c";
const MIGRATION_NAME = "20260823120000_professional_self_service";
const MIGRATION_CHECKSUM = "43577d45b500b60763343b861a6116a65258da2a70810d10ce2d6218a802e240";

async function ensureMigrationApplied() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "professionalId" TEXT;`);
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_professionalId_key" ON "AdminUser"("professionalId");`
  );
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'AdminUser_professionalId_fkey'
      ) THEN
        ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_professionalId_fkey"
          FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END $$;
  `);

  const already = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*)::bigint as count FROM "_prisma_migrations" WHERE migration_name = $1`,
    MIGRATION_NAME
  );
  if (Number(already[0]?.count ?? 0) === 0) {
    await prisma.$executeRaw`
      INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, started_at, applied_steps_count)
      VALUES (${randomUUID()}, ${MIGRATION_CHECKSUM}, now(), ${MIGRATION_NAME}, now(), 1)
    `;
  }
}

async function ensureAccounts() {
  const results: { label: string; email: string; password: string }[] = [];

  const ownerPassword = "Admin123!";
  await prisma.adminUser.upsert({
    where: { email: "admin@clinica.com" },
    update: { passwordHash: await bcrypt.hash(ownerPassword, 10), role: "OWNER", active: true },
    create: {
      name: "Administradora",
      email: "admin@clinica.com",
      passwordHash: await bcrypt.hash(ownerPassword, 10),
      role: "OWNER",
    },
  });
  results.push({ label: "Dueño/a (control total)", email: "admin@clinica.com", password: ownerPassword });

  const professional = await prisma.professional.findFirst({ orderBy: { order: "asc" } });
  if (professional) {
    const proPassword = "Doctora123!";
    const linkedTo = await prisma.adminUser.findUnique({ where: { professionalId: professional.id } });
    if (!linkedTo) {
      await prisma.adminUser.upsert({
        where: { email: "profesional@clinicavitalis.com" },
        update: { passwordHash: await bcrypt.hash(proPassword, 10), role: "STAFF", professionalId: professional.id, active: true },
        create: {
          name: professional.name,
          email: "profesional@clinicavitalis.com",
          passwordHash: await bcrypt.hash(proPassword, 10),
          role: "STAFF",
          professionalId: professional.id,
        },
      });
      results.push({
        label: `Profesional vinculado (${professional.name})`,
        email: "profesional@clinicavitalis.com",
        password: proPassword,
      });
    } else {
      results.push({
        label: `Profesional vinculado (${professional.name}) — ya existía`,
        email: linkedTo.email,
        password: "(sin cambios)",
      });
    }
  }

  const staffPassword = "Secretaria123!";
  await prisma.adminUser.upsert({
    where: { email: "secretaria@clinicavitalis.com" },
    update: { passwordHash: await bcrypt.hash(staffPassword, 10), role: "STAFF", active: true },
    create: {
      name: "Secretaría",
      email: "secretaria@clinicavitalis.com",
      passwordHash: await bcrypt.hash(staffPassword, 10),
      role: "STAFF",
    },
  });
  results.push({ label: "Staff / secretaria (sin vincular)", email: "secretaria@clinicavitalis.com", password: staffPassword });

  return results;
}

export default async function SetupInicialPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;
  if (key !== SETUP_KEY) {
    return <div className="p-10 text-center text-slate-400">404</div>;
  }

  let error: string | null = null;
  let accounts: { label: string; email: string; password: string }[] = [];

  try {
    await ensureMigrationApplied();
    accounts = await ensureAccounts();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <h1 className="text-lg font-semibold text-slate-900">Configuración inicial</h1>
        {error ? (
          <div className="rounded-xl bg-red-50 text-red-700 text-sm p-4">Error: {error}</div>
        ) : (
          <>
            <p className="text-sm text-slate-500">
              Base actualizada. Estas son las cuentas para entrar en <code>/admin/login</code>:
            </p>
            <div className="space-y-3">
              {accounts.map((a) => (
                <div key={a.email} className="rounded-xl border border-slate-200 p-3.5 text-sm">
                  <p className="font-medium text-slate-900">{a.label}</p>
                  <p className="text-slate-600 mt-1">
                    Email: <span className="font-mono">{a.email}</span>
                  </p>
                  <p className="text-slate-600">
                    Contraseña: <span className="font-mono">{a.password}</span>
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400">
              Cambiá estas contraseñas apenas entres (Configuración, o &quot;Mi perfil&quot; para el profesional).
            </p>
          </>
        )}
      </div>
    </div>
  );
}
