// components/wizard/WizardNav.tsx
"use client";
import Link from "next/link";

export function PrevButton({
  href = "",
  disabled = false,
}: {
  href?: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <button
        disabled
        className="rounded-lg border px-4 py-2 text-slate-500 opacity-60"
      >
        Atrás
      </button>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-lg border px-4 py-2 hover:bg-slate-50 focus:outline-none focus:ring"
    >
      Atrás
    </Link>
  );
}

export function NextButton({
  onClick,
  label = "¡Vamos al siguiente paso!",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-white shadow-sm hover:bg-emerald-500 active:opacity-95 focus:outline-none focus:ring focus:ring-emerald-200 transition-colors"
    >
      {label}
    </button>
  );
}
