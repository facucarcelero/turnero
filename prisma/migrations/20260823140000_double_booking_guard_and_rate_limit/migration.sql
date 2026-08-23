-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "activeSlotKey" TEXT;

-- Backfill: turnos activos (no cancelados) obtienen su clave de horario;
-- los cancelados quedan en NULL (no ocupan lugar en el índice único).
UPDATE "Appointment"
SET "activeSlotKey" = "professionalId" || '|' || "date" || '|' || "startTime"
WHERE "status" <> 'CANCELLED';

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_activeSlotKey_key" ON "Appointment"("activeSlotKey");

-- CreateTable
CREATE TABLE "RateLimitEntry" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitEntry_pkey" PRIMARY KEY ("key")
);
