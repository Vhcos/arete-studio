"use client";
import { useEffect, useState } from "react";

export default function BillingBadge() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/billing/me").then(async (r) => {
      const j = await r.json();
      if (j?.ok) setCount(j.creditsRemaining);
    });
  }, []);

  if (count === null) return null;

  return (
    <div className="rounded-full bg-slate-100 text-slate-700 text-xs px-3 py-1">
      IA disponibles: <strong>{count}</strong>
    </div>
  );
}
