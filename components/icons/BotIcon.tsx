// components/icons/BotIcon.tsx
"use client";

import * as React from "react";

type Variant = "sky" | "are" | "t3";

const PALETTES: Record<Variant, { from: string; to: string }> = {
  sky: { from: "#7dd3fc", to: "#38bdf8" }, // blue sky
  are: { from: "#60a5fa", to: "#38bdf8" }, // Are(bluesky)
  t3:  { from: "#2563eb", to: "#1d4ed8" }, // Blue intenso
};

export default function BotIcon({
  className = "w-4 h-4",
  variant = "t3",
  title = "IA Aret3",
  ...rest
}: React.SVGProps<SVGSVGElement> & { variant?: Variant; title?: string }) {
  const id = React.useId();
  const pal = PALETTES[variant];

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      role="img"
      className={className}
      {...rest}
    >
      <defs>
        <linearGradient id={`${id}-g`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor={pal.from} />
          <stop offset="100%" stopColor={pal.to} />
        </linearGradient>
      </defs>
      <title>{title}</title>
      {/* Bot head */}
      <rect x="3" y="6" width="18" height="13" rx="6" fill={`url(#${id}-g)`} />
      {/* Antenna */}
      <circle cx="12" cy="3.5" r="1.5" fill={pal.to} />
      <rect x="11.4" y="4.5" width="1.2" height="2.5" rx="0.6" fill={pal.to} />
      {/* Eyes */}
      <circle cx="9" cy="12" r="1.8" fill="white" />
      <circle cx="15" cy="12" r="1.8" fill="white" />
      <circle cx="9" cy="12" r="0.8" fill={pal.to} />
      <circle cx="15" cy="12" r="0.8" fill={pal.to} />
      {/* Smile */}
      <path
        d="M8 14.5c1.5 1.6 6.5 1.6 8 0"
        fill="none"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
