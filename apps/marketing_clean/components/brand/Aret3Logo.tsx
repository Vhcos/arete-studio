// apps/marketing_clean/components/brand/Aret3Logo.tsx
"use client";
import * as React from "react";

export default function Aret3Logo({
  size = 28,
  wordmark = false,
  color = "#1d4ed8", // azul base
  className = "",
}: {
  size?: number;
  wordmark?: boolean;
  color?: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="aret3"
      >
        {/* monograma “A” (ajusta el path si tienes tu A exacta) */}
        <path d="M24 4 L6 44 H14 L18.5 34 H29.5 L34 44 H42 L24 4 Z" fill={color} />
        <rect x="17" y="26" width="14" height="4" rx="2" fill="white" opacity="0.9" />
      </svg>

      {wordmark && (
        <span className="font-semibold tracking-tight text-slate-900">aret3</span>
      )}
    </span>
  );
}
