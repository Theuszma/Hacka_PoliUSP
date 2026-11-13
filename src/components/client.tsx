"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

export function NavLink({ href, children, exact, badge }: { href: string; children: ReactNode; exact?: boolean; badge?: number }) {
  const path = usePathname();
  const active = exact ? path === href : path === href || path.startsWith(href + "/");
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition ${
        active ? "bg-ink text-bg" : "text-muted hover:bg-sunken hover:text-ink"
      }`}
    >
      <span>{children}</span>
      {badge ? <span className="min-w-5 rounded-full bg-accent px-1.5 text-center text-[11px] text-accent-ink">{badge}</span> : null}
    </Link>
  );
}

export function SubmitButton({ children, className = "btn btn-primary", pendingText }: { children: ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingText ?? "Salvando…" : children}
    </button>
  );
}
