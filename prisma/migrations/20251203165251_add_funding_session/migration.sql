-- CreateTable
CREATE TABLE "public"."FundingSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientId" TEXT,
    "reportId" TEXT NOT NULL,
    "creditsCharged" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FundingSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FundingSession_userId_createdAt_idx" ON "public"."FundingSession"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "FundingSession_clientId_createdAt_idx" ON "public"."FundingSession"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "FundingSession_reportId_idx" ON "public"."FundingSession"("reportId");

-- AddForeignKey
ALTER TABLE "public"."FundingSession" ADD CONSTRAINT "FundingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FundingSession" ADD CONSTRAINT "FundingSession_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FundingSession" ADD CONSTRAINT "FundingSession_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."Report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
