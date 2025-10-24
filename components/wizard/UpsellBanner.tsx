// components/wizard/UpsellBanner.tsx
"use client";
import Link from "next/link";

export default function UpsellBanner({ className = "" }: { className?: string }) {
  return (
    <div className={`mt-6 ${className}`}>
      <Link
        href="/billing"
        className="block w-full rounded-2xl bg-blue-500 text-white text-center font-semibold py-4 px-6 shadow hover:bg-blue-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        Revisa nuestros planes para mejorar tu informe o Asesorías 1:1
      </Link>
    </div>
  );
}
