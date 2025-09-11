// components/Logo.tsx
import Image from "next/image";
import Link from "next/link";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" aria-label="ARET3" className={`inline-flex items-center gap-2 ${className}`}>
      <Image src="/aret3-logo.svg" alt="ARET3" width={80} height={80} priority />
      <span className="font-semibold tracking-tight">ARET3</span>
    </Link>
  );
}
