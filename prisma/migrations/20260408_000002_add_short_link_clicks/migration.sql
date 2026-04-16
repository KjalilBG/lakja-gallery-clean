-- CreateTable
CREATE TABLE "ShortLinkClick" (
    "id" TEXT NOT NULL,
    "shortLinkId" TEXT NOT NULL,
    "referer" TEXT,
    "sourceHost" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "country" TEXT,
    "city" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShortLinkClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShortLinkClick_shortLinkId_createdAt_idx" ON "ShortLinkClick"("shortLinkId", "createdAt");

-- CreateIndex
CREATE INDEX "ShortLinkClick_createdAt_idx" ON "ShortLinkClick"("createdAt");

-- CreateIndex
CREATE INDEX "ShortLinkClick_sourceHost_idx" ON "ShortLinkClick"("sourceHost");

-- CreateIndex
CREATE INDEX "ShortLinkClick_utmSource_idx" ON "ShortLinkClick"("utmSource");

-- AddForeignKey
ALTER TABLE "ShortLinkClick" ADD CONSTRAINT "ShortLinkClick_shortLinkId_fkey" FOREIGN KEY ("shortLinkId") REFERENCES "ShortLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
