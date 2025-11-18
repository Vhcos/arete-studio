// app/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import CreditsModal from "@/components/credits/CreditsModal";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <CreditsModal />
    </SessionProvider>
  );
}
