-- AlterTable
ALTER TABLE "Professional" ADD COLUMN     "asksInsurance" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "insuranceMemberNumber" TEXT,
ADD COLUMN     "insuranceProviderId" TEXT;

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "copaymentAmount" DOUBLE PRECISION,
ADD COLUMN     "insuranceMemberNumber" TEXT,
ADD COLUMN     "insuranceProviderId" TEXT;

-- CreateTable
CREATE TABLE "InsuranceProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsuranceProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProfessionalInsuranceProviders" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProfessionalInsuranceProviders_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ProfessionalInsuranceProviders_B_index" ON "_ProfessionalInsuranceProviders"("B");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_insuranceProviderId_fkey" FOREIGN KEY ("insuranceProviderId") REFERENCES "InsuranceProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_insuranceProviderId_fkey" FOREIGN KEY ("insuranceProviderId") REFERENCES "InsuranceProvider"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProfessionalInsuranceProviders" ADD CONSTRAINT "_ProfessionalInsuranceProviders_A_fkey" FOREIGN KEY ("A") REFERENCES "InsuranceProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProfessionalInsuranceProviders" ADD CONSTRAINT "_ProfessionalInsuranceProviders_B_fkey" FOREIGN KEY ("B") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

