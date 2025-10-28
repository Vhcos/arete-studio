// apps/marketing_clean/components/common/SocialLinks.tsx
"use client";

import React from "react";


type Props = {
  className?: string;
  size?: number; // tamaño en px de los íconos
};

export default function SocialLinks({ className = "", size = 18 }: Props) {
  // URLs provistas por ti
  const FACEBOOK_URL = "https://web.facebook.com/victorhurtadocos";
  const INSTAGRAM_URL = "https://www.instagram.com/victorhurtadocos/";
  const TIKTOK_URL = "https://www.tiktok.com/@victorhurtadocos";
  const X_URL = "https://x.com/HurtadoVictorE";
  const LINKEDIN_URL =
    "https://www.linkedin.com/in/victor-hurtado-cosmelli-6a9924190/";

  const iconSize = { width: size, height: size };

  const baseBtn =
    "inline-flex items-center justify-center rounded-full p-2 text-slate-500 ring-1 ring-slate-200 " +
    "hover:text-slate-700 hover:ring-slate-300 active:opacity-95 transition";

  return (
    <nav className={`flex items-center gap-3 ${className}`} aria-label="Redes sociales">
      {/* Facebook */}
      <a
        href={FACEBOOK_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Ir a Facebook"
        className={baseBtn}
        title="Facebook"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" {...iconSize} aria-hidden="true">
          <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.14 8.44 9.94v-7.03H7.9v-2.9h2.54V9.41c0-2.5 1.49-3.88 3.77-3.88 1.09 0 2.22.19 2.22.19v2.44h-1.25c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.9h-2.34V22c4.78-.8 8.44-4.94 8.44-9.94Z" />
        </svg>
      </a>

      {/* Instagram */}
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Ir a Instagram"
        className={baseBtn}
        title="Instagram"
      >
        <svg viewBox="0 0 24 24" {...iconSize} aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
        </svg>
      </a>

      {/* TikTok */}
      <a
        href={TIKTOK_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Ir a TikTok"
        className={baseBtn}
        title="TikTok"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" {...iconSize} aria-hidden="true">
          {/* Nota musical estilizada (representación simple) */}
          <path d="M12 3h3c.28 2.04 1.93 3.72 4 4v3c-1.9 0-3.7-.68-5-1.85V16.5a4.5 4.5 0 11-3-4.24V3z" />
        </svg>
      </a>

      {/* X (Twitter) */}
      <a
        href={X_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Ir a X (Twitter)"
        className={baseBtn}
        title="X (Twitter)"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" {...iconSize} aria-hidden="true">
          <path d="M18.244 3H21l-6.39 7.297L22 21h-5.586l-4.366-5.27L6.914 21H4l6.831-7.81L2 3h5.707l4.02 4.86L18.244 3Zm-1.952 16.04h1.086L7.78 4.9H6.62l9.672 14.14Z" />
        </svg>
      </a>

      {/* LinkedIn */}
      <a
        href={LINKEDIN_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Ir a LinkedIn"
        className={baseBtn}
        title="LinkedIn"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" {...iconSize} aria-hidden="true">
          <path d="M20 3H4a2 2 0 00-2 2v14c0 1.1.9 2 2 2h16a2 2 0 002-2V5a2 2 0 00-2-2ZM8.34 18H6V10h2.34v8ZM7.17 8.9c-.75 0-1.36-.62-1.36-1.38 0-.76.61-1.38 1.36-1.38.75 0 1.35.62 1.35 1.38 0 .76-.6 1.38-1.35 1.38ZM18 18h-2.34v-4.23c0-1.01-.02-2.31-1.41-2.31-1.41 0-1.62 1.1-1.62 2.24V18H10.3V10h2.25v1.09h.03c.31-.6 1.06-1.23 2.19-1.23 2.35 0 2.78 1.55 2.78 3.57V18Z" />
        </svg>
      </a>
    </nav>
  );
}
