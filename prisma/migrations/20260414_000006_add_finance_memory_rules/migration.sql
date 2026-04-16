CREATE TABLE "FinanceMemoryRule" (
  "id" TEXT NOT NULL,
  "alias" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "type" "FinanceTransactionType" NOT NULL,
  "owner" "FinanceOwner",
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "source" "FinanceSourceChannel" NOT NULL DEFAULT 'IMPORT',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "FinanceMemoryRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FinanceMemoryRule_alias_isActive_idx" ON "FinanceMemoryRule"("alias", "isActive");
CREATE INDEX "FinanceMemoryRule_owner_type_idx" ON "FinanceMemoryRule"("owner", "type");
