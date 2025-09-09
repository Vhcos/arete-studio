"use client";
import Link from "next/link";

export function PrevButton({ href = "", disabled = false }: { href?: string; disabled?: boolean }) {
  if (disabled) {
    return <button disabled className="rounded-lg border px-4 py-2 text-slate-500 opacity-60">Atrás</button>;
  }
  return (
    <Link href={href} className="rounded-lg border px-4 py-2 hover:bg-slate-50 focus:outline-none focus:ring">
      Atrás
    </Link>
  );
}

export function NextButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 focus:outline-none focus:ring"
    >
      Siguiente
    </button>
  );
}
