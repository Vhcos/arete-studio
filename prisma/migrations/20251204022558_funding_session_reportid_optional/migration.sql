-- DropForeignKey
ALTER TABLE "public"."FundingSession" DROP CONSTRAINT "FundingSession_reportId_fkey";

-- AlterTable
ALTER TABLE "public"."FundingSession" ALTER COLUMN "reportId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."FundingSession" ADD CONSTRAINT "FundingSession_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;
