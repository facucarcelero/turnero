-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "comboId" TEXT;

-- CreateTable
CREATE TABLE "ServiceCombo" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "price" DOUBLE PRECISION,
    "durationMin" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceCombo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ComboServices" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ComboServices_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AppointmentExtraServices" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AppointmentExtraServices_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ComboServices_B_index" ON "_ComboServices"("B");

-- CreateIndex
CREATE INDEX "_AppointmentExtraServices_B_index" ON "_AppointmentExtraServices"("B");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_comboId_fkey" FOREIGN KEY ("comboId") REFERENCES "ServiceCombo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ComboServices" ADD CONSTRAINT "_ComboServices_A_fkey" FOREIGN KEY ("A") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ComboServices" ADD CONSTRAINT "_ComboServices_B_fkey" FOREIGN KEY ("B") REFERENCES "ServiceCombo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AppointmentExtraServices" ADD CONSTRAINT "_AppointmentExtraServices_A_fkey" FOREIGN KEY ("A") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AppointmentExtraServices" ADD CONSTRAINT "_AppointmentExtraServices_B_fkey" FOREIGN KEY ("B") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
