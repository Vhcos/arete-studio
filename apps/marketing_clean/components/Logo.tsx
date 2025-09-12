import React from "react";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/aret3-logo.svg"
        alt="Aret3"
        className="h-40 w-40"
        width={70}
        height={70}
      />
      <span className="text-lg font-semibold tracking-tight text-slate-900">
        ARET3
      </span>
    </div>
  );
}
