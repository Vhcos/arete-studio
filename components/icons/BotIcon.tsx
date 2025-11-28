// components/icons/BotIcon.tsx 
"use client";

import * as React from "react";

type Variant = "sky" | "are" | "t3";
type Mark = "A" | "IA";
type GlowHue = "brand" | "gold";

const PALETTES: Record<Variant, { from: string; to: string }> = {
  sky: { from: "#7dd3fc", to: "#38bdf8" },
  are: { from: "#60a5fa", to: "#38bdf8" },
  t3:  { from: "#2563eb", to: "#1d4ed8" },
};

export default function BotIcon({
  className = "w-5 h-5",
  variant = "t3",
  mark = "A",
  title = "IA Aret3",
  glow = true,
  glowHue = "brand",
  ...rest
}: React.SVGProps<SVGSVGElement> & {
  variant?: Variant; mark?: Mark; title?: string;
  glow?: boolean; glowHue?: GlowHue;
}) {
  const id = React.useId();
  const pal = PALETTES[variant];

  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true" className={className} {...rest}>
      <defs>
        {/* Gradiente de relleno (letra) */}
        <linearGradient id={`${id}-g`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor={pal.from} />
          <stop offset="100%" stopColor={pal.to} />
        </linearGradient>

        {/* Glow radial: brand (azul) y gold (ámbar) */}
        <radialGradient id={`${id}-rg-brand`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={pal.from} stopOpacity="0.9" />
          <stop offset="60%" stopColor={pal.to} stopOpacity="0.35" />
          <stop offset="100%" stopColor={pal.to} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-rg-gold`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.95" />   {/* amber-500 */}
          <stop offset="55%" stopColor="#fbbf24" stopOpacity="0.45" />  {/* amber-400 */}
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>

        {/* Filtro de suavizado */}
        <filter id={`${id}-glow`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.6" />
        </filter>

        {/* Animación embebida */}
        <style>
          {`
            .ai-glow { transform-box: fill-box; transform-origin: center; animation: aiPulse 2.2s ease-in-out infinite; }
            @keyframes aiPulse {
              0%   { opacity:.35; transform:scale(.92); }
              50%  { opacity:.9;  transform:scale(1.06); }
              100% { opacity:.35; transform:scale(.92); }
            }
          `}
        </style>

        {/* Clip de letra(s) */}
        <clipPath id={`${id}-clip`}>
          {mark === "IA" ? (
            <g>
              <rect x="4.2" y="5" width="3" height="14" rx="1.2" />
              <path d="M12 3.4 L20.4 21 H16.1 L14.4 17.3 H9.6 L7.9 21 H3.8 L12 3.4 Z" />
              <rect x="9.2" y="12.2" width="6" height="1.6" rx="0.8" />
            </g>
          ) : (
            <g>
              <path d="M12 3.4 L20.4 21 H16.1 L14.4 17.3 H9.6 L7.9 21 H3.8 L12 3.4 Z" />
              <rect x="9.2" y="12.2" width="6" height="1.6" rx="0.8" />
            </g>
          )}
        </clipPath>
      </defs>

      <title>{title}</title>

      {/* Halo dorado o de marca */}
      {glow && (
        <g className="ai-glow">
          <circle
            cx="12" cy="12" r="10.4"
            fill={`url(#${id}-rg-${glowHue})`}
            filter={`url(#${id}-glow)`}
          />
        </g>
      )}

      {/* Relleno de la(s) letra(s) */}
      {mark === "IA" ? (
        <g>
          <rect x="4.2" y="5" width="3" height="14" rx="1.2" fill={`url(#${id}-g)`} />
          <path d="M12 3.4 L20.4 21 H16.1 L14.4 17.3 H9.6 L7.9 21 H3.8 L12 3.4 Z" fill={`url(#${id}-g)`} />
          <rect x="9.2" y="12.2" width="6" height="1.6" rx="0.8" fill="white" opacity=".95" />
        </g>
      ) : (
        <g>
          <path d="M12 3.4 L20.4 21 H16.1 L14.4 17.3 H9.6 L7.9 21 H3.8 L12 3.4 Z" fill={`url(#${id}-g)`} />
          <rect x="9.2" y="12.2" width="6" height="1.6" rx="0.8" fill="white" opacity=".95" />
        </g>
      )}

      {/* Red neuronal dentro de la(s) letra(s) */}
      <g clipPath={`url(#${id}-clip)`} stroke="white" strokeWidth=".9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 17 L10 10 L12 14 L15 8 L18 18" opacity=".65" />
        <path d="M7 9 L11 7 L13.8 9.2 L12 12.4 L9.4 15.6" opacity=".45" />
        <path d="M5.8 13 L9.6 11.2 L14.2 13.6 L16.6 16.2" opacity=".45" />
        <g fill="white">
          <circle cx="6" cy="17" r="1.1" /><circle cx="10" cy="10" r="1.1" />
          <circle cx="12" cy="14" r="1.1" /><circle cx="15" cy="8" r="1.1" />
          <circle cx="18" cy="18" r="1.1" /><circle cx="11" cy="7" r="1.05" />
          <circle cx="7" cy="9" r="1.05" /><circle cx="9.4" cy="15.6" r="1.05" />
        </g>
        <g fill={glowHue === "gold" ? "#f59e0b" : pal.to} opacity=".95">
          <circle cx="6" cy="17" r=".45" /><circle cx="10" cy="10" r=".45" />
          <circle cx="12" cy="14" r=".45" /><circle cx="15" cy="8" r=".45" />
          <circle cx="18" cy="18" r=".45" /><circle cx="11" cy="7" r=".4" />
          <circle cx="7" cy="9" r=".4" /><circle cx="9.4" cy="15.6" r=".4" />
        </g>
      </g>

      {/* Contorno sutil */}
      <g fill="none" stroke="white" strokeOpacity=".9" strokeWidth=".8">
        {mark === "IA" && <rect x="4.2" y="5" width="3" height="14" rx="1.2" />}
        <path d="M12 3.4 L20.4 21 H16.1 L14.4 17.3 H9.6 L7.9 21 H3.8 L12 3.4 Z" />
      </g>
    </svg>
  );
}
