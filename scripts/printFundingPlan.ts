// scripts/printFundingPlan.ts
import { prisma } from "../lib/prisma";


async function main() {
  const sessionId = process.argv[2];
  if (!sessionId) throw new Error("Pasa sessionId");

  const fs = await prisma.fundingSession.findUnique({
    where: { id: sessionId },
    select: { payload: true },
  });

  const p: any = fs?.payload ?? {};
  console.log("aiPlan:", JSON.stringify(p.aiPlan, null, 2));
  console.log("iaReportRaw:", JSON.stringify(p.iaReportRaw, null, 2));
}
main().finally(() => prisma.$disconnect());
