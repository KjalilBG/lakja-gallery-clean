CREATE TYPE "FinanceCategoryDirection" AS ENUM ('INCOME', 'EXPENSE', 'SPECIAL');

CREATE TABLE "FinanceCategory" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "direction" "FinanceCategoryDirection" NOT NULL,
  "owner" "FinanceOwner",
  "description" TEXT,
  "color" TEXT,
  "icon" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FinanceCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FinanceBotSettings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "transactionDefaultTemplate" TEXT NOT NULL DEFAULT E'✅ Movimiento registrado\n{amount} MXN · {description}',
  "transactionLakjaExpenseTemplate" TEXT NOT NULL DEFAULT E'✅ Gasto operativo LaKja registrado\n{amount} MXN · {description}',
  "transactionHonorariosKjalilTemplate" TEXT NOT NULL DEFAULT '✅ Honorarios a Kjalil registrados',
  "transactionHonorariosTercerosTemplate" TEXT NOT NULL DEFAULT '✅ Honorarios a tercero registrados',
  "reportHeaderTemplate" TEXT NOT NULL DEFAULT E'📊 Reporte {ownerLabel}\nPeriodo: {periodLabel}',
  "reportFooterTemplate" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FinanceBotSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FinanceCategory_slug_key" ON "FinanceCategory"("slug");
CREATE INDEX "FinanceCategory_direction_owner_isActive_idx" ON "FinanceCategory"("direction", "owner", "isActive");
CREATE INDEX "FinanceCategory_sortOrder_idx" ON "FinanceCategory"("sortOrder");
