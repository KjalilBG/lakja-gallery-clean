-- CreateEnum
CREATE TYPE "CoberturaStatus" AS ENUM ('AGENDADO', 'SOLICITADO', 'REALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('HOURLY', 'FLAT', 'MIXED');

-- CreateEnum
CREATE TYPE "HistoryAction" AS ENUM ('CREATED', 'UPDATED', 'STATUS_CHANGED', 'STAFF_REASSIGNED', 'DUPLICATED', 'DELETED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'STAFF';

-- AlterTable
ALTER TABLE "AdminNotebook" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Campus" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seccion" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Seccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lugar" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "campusId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lugar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cobertura" (
    "id" TEXT NOT NULL,
    "folio" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "duracion" INTEGER NOT NULL,
    "carpetaNombre" TEXT NOT NULL,
    "campusId" TEXT,
    "seccionId" TEXT,
    "lugarId" TEXT,
    "estatus" "CoberturaStatus" NOT NULL DEFAULT 'AGENDADO',
    "comentarios" TEXT,
    "detalles" TEXT,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cobertura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoberturaStaff" (
    "id" TEXT NOT NULL,
    "coberturaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isLead" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoberturaStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoverageStaffNote" (
    "id" TEXT NOT NULL,
    "coberturaId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nota" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoverageStaffNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffHonorario" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentType" "PaymentType" NOT NULL DEFAULT 'HOURLY',
    "costoHora" DECIMAL(10,2),
    "transporte" DECIMAL(10,2),
    "reglaIguala1a2" DECIMAL(10,2),
    "reglaIguala3a4" DECIMAL(10,2),
    "reglaIguala5Plus" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffHonorario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoberturaHistory" (
    "id" TEXT NOT NULL,
    "coberturaId" TEXT NOT NULL,
    "userId" TEXT,
    "action" "HistoryAction" NOT NULL,
    "field" TEXT,
    "beforeValue" TEXT,
    "afterValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoberturaHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoveragePreset" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "duracion" INTEGER NOT NULL,
    "lugarId" TEXT,
    "seccionId" TEXT,
    "comentarios" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoveragePreset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Campus_nombre_key" ON "Campus"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Campus_slug_key" ON "Campus"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Seccion_nombre_key" ON "Seccion"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Seccion_slug_key" ON "Seccion"("slug");

-- CreateIndex
CREATE INDEX "Lugar_campusId_nombre_idx" ON "Lugar"("campusId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Lugar_campusId_slug_key" ON "Lugar"("campusId", "slug");

-- CreateIndex
CREATE INDEX "Cobertura_fecha_estatus_idx" ON "Cobertura"("fecha", "estatus");

-- CreateIndex
CREATE INDEX "Cobertura_campusId_seccionId_lugarId_idx" ON "Cobertura"("campusId", "seccionId", "lugarId");

-- CreateIndex
CREATE UNIQUE INDEX "Cobertura_fecha_folio_key" ON "Cobertura"("fecha", "folio");

-- CreateIndex
CREATE INDEX "CoberturaStaff_userId_createdAt_idx" ON "CoberturaStaff"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CoberturaStaff_coberturaId_userId_key" ON "CoberturaStaff"("coberturaId", "userId");

-- CreateIndex
CREATE INDEX "CoverageStaffNote_coberturaId_createdAt_idx" ON "CoverageStaffNote"("coberturaId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StaffHonorario_userId_key" ON "StaffHonorario"("userId");

-- CreateIndex
CREATE INDEX "CoberturaHistory_coberturaId_createdAt_idx" ON "CoberturaHistory"("coberturaId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CoveragePreset_nombre_key" ON "CoveragePreset"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "CoveragePreset_slug_key" ON "CoveragePreset"("slug");

-- AddForeignKey
ALTER TABLE "Lugar" ADD CONSTRAINT "Lugar_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cobertura" ADD CONSTRAINT "Cobertura_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cobertura" ADD CONSTRAINT "Cobertura_seccionId_fkey" FOREIGN KEY ("seccionId") REFERENCES "Seccion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cobertura" ADD CONSTRAINT "Cobertura_lugarId_fkey" FOREIGN KEY ("lugarId") REFERENCES "Lugar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cobertura" ADD CONSTRAINT "Cobertura_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cobertura" ADD CONSTRAINT "Cobertura_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoberturaStaff" ADD CONSTRAINT "CoberturaStaff_coberturaId_fkey" FOREIGN KEY ("coberturaId") REFERENCES "Cobertura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoberturaStaff" ADD CONSTRAINT "CoberturaStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverageStaffNote" ADD CONSTRAINT "CoverageStaffNote_coberturaId_fkey" FOREIGN KEY ("coberturaId") REFERENCES "Cobertura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverageStaffNote" ADD CONSTRAINT "CoverageStaffNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffHonorario" ADD CONSTRAINT "StaffHonorario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoberturaHistory" ADD CONSTRAINT "CoberturaHistory_coberturaId_fkey" FOREIGN KEY ("coberturaId") REFERENCES "Cobertura"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoberturaHistory" ADD CONSTRAINT "CoberturaHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoveragePreset" ADD CONSTRAINT "CoveragePreset_lugarId_fkey" FOREIGN KEY ("lugarId") REFERENCES "Lugar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoveragePreset" ADD CONSTRAINT "CoveragePreset_seccionId_fkey" FOREIGN KEY ("seccionId") REFERENCES "Seccion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

