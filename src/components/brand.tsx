import Link from "next/link";
import { cn } from "./ui/cn";

export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className={cn("shrink-0", className)}>
      <rect width="32" height="32" rx="8" className="fill-foreground" />
      <circle cx="12.5" cy="16" r="5.5" fill="none" strokeWidth="2.6" className="stroke-background" />
      <circle cx="19.5" cy="16" r="5.5" fill="none" strokeWidth="2.6" className="stroke-brand" />
    </svg>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <LogoMark />
      <span className="text-[17px]">Elo</span>
    </Link>
  );
}
