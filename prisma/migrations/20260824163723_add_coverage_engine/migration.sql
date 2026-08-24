-- CreateEnum
CREATE TYPE "CoverageState" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED', 'SUSPENDED', 'NOT_FOUND', 'AUTHORIZATION_REQUIRED', 'NOT_COVERED', 'SOURCE_UNAVAILABLE', 'UNKNOWN', 'MANUAL_VERIFICATION_REQUIRED');

-- CreateEnum
CREATE TYPE "CoverageConnectorStatus" AS ENUM ('NOT_AVAILABLE', 'AVAILABLE', 'DEGRADED');

-- CreateEnum
CREATE TYPE "ProviderAgreementStatus" AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED', 'TERMINATED', 'UNKNOWN');

-- AlterTable
ALTER TABLE "InsuranceProvider" ADD COLUMN     "connectorKey" TEXT;

-- CreateTable
CREATE TABLE "CoverageVerification" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT,
    "patientId" TEXT,
    "insuranceProviderId" TEXT,
    "requestedById" TEXT,
    "source" "AppointmentSource" NOT NULL,
    "state" "CoverageState" NOT NULL,
    "connectorStatus" "CoverageConnectorStatus" NOT NULL DEFAULT 'NOT_AVAILABLE',
    "sourceId" TEXT NOT NULL,
    "memberNumberMasked" TEXT,
    "suggestedCopaymentAmount" DECIMAL(10,2),
    "durationMs" INTEGER,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoverageVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CopayRule" (
    "id" TEXT NOT NULL,
    "insuranceProviderId" TEXT NOT NULL,
    "professionalId" TEXT,
    "serviceId" TEXT,
    "planName" TEXT,
    "copaymentAmount" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CopayRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderAgreement" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "insuranceProviderId" TEXT NOT NULL,
    "status" "ProviderAgreementStatus" NOT NULL DEFAULT 'UNKNOWN',
    "rnpCode" TEXT,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoverageVerification_insuranceProviderId_createdAt_idx" ON "CoverageVerification"("insuranceProviderId", "createdAt");

-- CreateIndex
CREATE INDEX "CoverageVerification_appointmentId_idx" ON "CoverageVerification"("appointmentId");

-- CreateIndex
CREATE INDEX "CoverageVerification_patientId_idx" ON "CoverageVerification"("patientId");

-- CreateIndex
CREATE INDEX "CopayRule_insuranceProviderId_professionalId_serviceId_idx" ON "CopayRule"("insuranceProviderId", "professionalId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderAgreement_professionalId_insuranceProviderId_key" ON "ProviderAgreement"("professionalId", "insuranceProviderId");

-- AddForeignKey
ALTER TABLE "CoverageVerification" ADD CONSTRAINT "CoverageVerification_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverageVerification" ADD CONSTRAINT "CoverageVerification_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverageVerification" ADD CONSTRAINT "CoverageVerification_insuranceProviderId_fkey" FOREIGN KEY ("insuranceProviderId") REFERENCES "InsuranceProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverageVerification" ADD CONSTRAINT "CoverageVerification_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CopayRule" ADD CONSTRAINT "CopayRule_insuranceProviderId_fkey" FOREIGN KEY ("insuranceProviderId") REFERENCES "InsuranceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CopayRule" ADD CONSTRAINT "CopayRule_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CopayRule" ADD CONSTRAINT "CopayRule_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderAgreement" ADD CONSTRAINT "ProviderAgreement_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderAgreement" ADD CONSTRAINT "ProviderAgreement_insuranceProviderId_fkey" FOREIGN KEY ("insuranceProviderId") REFERENCES "InsuranceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
