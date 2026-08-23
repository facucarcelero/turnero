-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN "professionalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_professionalId_key" ON "AdminUser"("professionalId");

-- AddForeignKey
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;
