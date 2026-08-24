-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "insuranceVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "insuranceVerifiedUntil" TEXT;

-- AlterTable
ALTER TABLE "InsuranceProvider" ADD COLUMN     "defaultCopayment" DOUBLE PRECISION;
