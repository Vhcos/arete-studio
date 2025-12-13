//components/funding/FundingProgressHeaderAuto.tsx
"use client";

import { useParams, useSelectedLayoutSegment } from "next/navigation";
import FundingProgressHeader from "@/components/funding/FundingProgressHeader";

type FundingStepId = "f1" | "f2" | "f3" | "f4" | "f5" | "f6" | "f7" | "f8";

const VALID: FundingStepId[] = ["f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8"];

export default function FundingProgressHeaderAuto() {
  const params = useParams();
  const sessionId = params?.sessionId as string | undefined;

  // En /funding/[sessionId] => segment es null => F1
  // En /funding/[sessionId]/f2 => segment "f2"
  const segment = useSelectedLayoutSegment(); // string | null
  const current = (segment && VALID.includes(segment as FundingStepId) ? (segment as FundingStepId) : "f1");

  if (!sessionId) return null;

  return <FundingProgressHeader sessionId={sessionId} current={current} />;
}
