import Image from "next/image";

export default function Logo({ size = 44 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/aret3-logo.svg"
        alt="ARET3"
        width={size}
        height={size}
        priority
      />
      <span className="text-xl font-semibold tracking-tight">ARET3</span>
    </div>
  );
}
