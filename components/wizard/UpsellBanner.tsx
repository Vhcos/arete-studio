// components/wizard/UpsellBanner.tsx
"use client";
import Link from "next/link";

export default function UpsellBanner({ className = "" }: { className?: string }) {
  return (
    <div className={`mt-6 ${className}`}>
      {/* Móvil (≤ sm): compacto y copy corto */}
      <Link
        href="/billing"
        className="sm:hidden block w-full rounded-xl bg-blue-800 text-white text-center font-semibold py-2.5 px-4 shadow hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-sm leading-tight truncate"
        aria-label="Mejora tu plan y asesorías 1 a 1"
      >
        Mejora tu plan · asesorías 1:1
      </Link>

      {/* Desktop/Tablet (≥ sm): ligeramente más pequeño que antes */}
      <Link
        href="/billing"
        className="hidden sm:block w-full rounded-xl bg-blue-800 text-white text-center font-semibold py-3 px-5 text-[15px] shadow hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label="Revisa nuestros planes para mejorar tu informe o asesorías 1 a 1"
      >
        Revisa nuestros planes para mejorar tu informe o Asesorías 1:1
      </Link>
    </div>
  );
}
