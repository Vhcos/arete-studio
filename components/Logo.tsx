import Image from "next/image";
import Link from "next/link";

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Image src="/arete-logo.svg" alt="Arete" width={size} height={size} priority />
      <span className="font-semibold tracking-tight">Arete</span>
    </Link>
  );
}
