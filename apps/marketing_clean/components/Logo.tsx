// apps/marketing_clean/components/Logo.tsx
import React from "react";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
       <span className="text-lg font-semibold italic tracking-tight text-blue-700">
        Aret3
      </span>
      <img
        src="/aret3-logo.svg"
        alt="Aret3"
        className="h-40 w-40"
        width={70}
        height={70}
      />
     
    </div>
  );
}
