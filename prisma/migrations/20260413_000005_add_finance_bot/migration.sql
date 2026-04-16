CREATE TYPE "FinanceOwner" AS ENUM ('LAKJA', 'KJALIL', 'KK');

CREATE TYPE "FinanceTransactionType" AS ENUM ('INCOME', 'EXPENSE', 'SPECIAL', 'HONORARIOS_KJALIL', 'HONORARIOS_TERCEROS');

CREATE TYPE "FinanceTransactionStatus" AS ENUM ('CONFIRMED', 'NEEDS_REVIEW');

CREATE TYPE "FinanceSpecialType" AS ENUM ('PRESTAMO_DADO', 'PRESTAMO_RECUPERADO', 'REEMBOLSO', 'TRANSFERENCIA', 'AJUSTE', 'OTRO');

CREATE TYPE "FinanceSourceChannel" AS ENUM ('TELEGRAM', 'DASHBOARD', 'IMPORT', 'SYSTEM');

CREATE TABLE "FinanceTransaction" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "type" "FinanceTransactionType" NOT NULL,
  "owner" "FinanceOwner" NOT NULL,
  "category" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'MXN',
  "description" TEXT NOT NULL,
  "rawMessage" TEXT NOT NULL,
  "alias" TEXT,
  "memoryNote" TEXT,
  "confidence" DECIMAL(4,3) NOT NULL,
  "status" "FinanceTransactionStatus" NOT NULL DEFAULT 'CONFIRMED',
  "specialType" "FinanceSpecialType",
  "counterpartyName" TEXT,
  "sourceChannel" "FinanceSourceChannel" NOT NULL DEFAULT 'TELEGRAM',
  "reportPeriodKey" TEXT NOT NULL,
  "telegramChatId" TEXT,
  "telegramMessageId" TEXT,
  "metadata" JSONB,
  CONSTRAINT "FinanceTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FinanceTelegramChat" (
  "id" TEXT NOT NULL,
  "chatId" TEXT NOT NULL,
  "label" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastSeenAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FinanceTelegramChat_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FinanceMonthlyDigest" (
  "id" TEXT NOT NULL,
  "periodKey" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "recipient" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'resend',
  "status" TEXT NOT NULL DEFAULT 'SENT',
  "metadata" JSONB,
  CONSTRAINT "FinanceMonthlyDigest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FinanceTelegramChat_chatId_key" ON "FinanceTelegramChat"("chatId");
CREATE UNIQUE INDEX "FinanceMonthlyDigest_periodKey_key" ON "FinanceMonthlyDigest"("periodKey");

CREATE INDEX "FinanceTransaction_owner_date_idx" ON "FinanceTransaction"("owner", "date");
CREATE INDEX "FinanceTransaction_type_date_idx" ON "FinanceTransaction"("type", "date");
CREATE INDEX "FinanceTransaction_reportPeriodKey_owner_idx" ON "FinanceTransaction"("reportPeriodKey", "owner");
CREATE INDEX "FinanceTransaction_createdAt_idx" ON "FinanceTransaction"("createdAt");
