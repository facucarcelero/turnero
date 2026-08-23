import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

// Página temporal de uso único: no hay acceso de terminal a la base de
// producción desde este entorno, así que se aplica acá la migración
// pendiente (professionalId ya se aplicó una vez con esta misma técnica;
// ahora es el turno de obras sociales/coseguro). Se borra apenas se
// confirme que quedó aplicada.
const SETUP_KEY = "ddd6684ba721648a35aeaef9648e1b16";
const MIGRATION_NAME = "20260823130000_insurance_providers";
const MIGRATION_CHECKSUM = "89f5af5046581cf146716a123e97fb3a3ba0f34bb3ee8309c1869d59ab16724d";

async function ensureMigrationApplied() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "Professional" ADD COLUMN IF NOT EXISTS "asksInsurance" BOOLEAN NOT NULL DEFAULT false;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "insuranceMemberNumber" TEXT;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "Patient" ADD COLUMN IF NOT EXISTS "insuranceProviderId" TEXT;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "copaymentAmount" DOUBLE PRECISION;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "insuranceMemberNumber" TEXT;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "insuranceProviderId" TEXT;`);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "InsuranceProvider" (
      "id" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "active" BOOLEAN NOT NULL DEFAULT true,
      "order" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "InsuranceProvider_pkey" PRIMARY KEY ("id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "_ProfessionalInsuranceProviders" (
      "A" TEXT NOT NULL,
      "B" TEXT NOT NULL,
      CONSTRAINT "_ProfessionalInsuranceProviders_AB_pkey" PRIMARY KEY ("A","B")
    );
  `);

  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "_ProfessionalInsuranceProviders_B_index" ON "_ProfessionalInsuranceProviders"("B");`
  );

  const constraints: [string, string][] = [
    [
      "Patient_insuranceProviderId_fkey",
      `ALTER TABLE "Patient" ADD CONSTRAINT "Patient_insuranceProviderId_fkey" FOREIGN KEY ("insuranceProviderId") REFERENCES "InsuranceProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    ],
    [
      "Appointment_insuranceProviderId_fkey",
      `ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_insuranceProviderId_fkey" FOREIGN KEY ("insuranceProviderId") REFERENCES "InsuranceProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
    ],
    [
      "_ProfessionalInsuranceProviders_A_fkey",
      `ALTER TABLE "_ProfessionalInsuranceProviders" ADD CONSTRAINT "_ProfessionalInsuranceProviders_A_fkey" FOREIGN KEY ("A") REFERENCES "InsuranceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    ],
    [
      "_ProfessionalInsuranceProviders_B_fkey",
      `ALTER TABLE "_ProfessionalInsuranceProviders" ADD CONSTRAINT "_ProfessionalInsuranceProviders_B_fkey" FOREIGN KEY ("B") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    ],
  ];

  for (const [name, sql] of constraints) {
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = '${name}'
        ) THEN
          ${sql};
        END IF;
      END $$;
    `);
  }

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
  let done = false;

  try {
    await ensureMigrationApplied();
    done = true;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <h1 className="text-lg font-semibold text-slate-900">Configuración inicial</h1>
        {error ? (
          <div className="rounded-xl bg-red-50 text-red-700 text-sm p-4">Error: {error}</div>
        ) : done ? (
          <p className="text-sm text-slate-600">
            Listo — se agregó la tabla de obras sociales/prepagas y los campos de cobertura y coseguro.
            Ya podés usar Profesionales, Pacientes y Turnos con esta función. Avisá para borrar esta página.
          </p>
        ) : null}
      </div>
    </div>
  );
}
