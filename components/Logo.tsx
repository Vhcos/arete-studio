// components/Logo.tsx
import Image from "next/image";
import Link from "next/link";

const HOME = process.env.NEXT_PUBLIC_MARKETING_URL || "https://aret3.cl";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href={HOME}
      prefetch={false}
      aria-label="ARET3"
      className={`inline-flex items-center gap-2 shrink-0 ${className}`}
    >
      <Image
        src="/aret3-logo.svg"
        alt="ARET3"
        width={28}
        height={28}
        priority
        className="h-20 w-20 shrink-0"
      />
      <span className="hidden sm:inline font-semibold tracking-tight">
        ARET3
      </span>
    </Link>
  );
}
