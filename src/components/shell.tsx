import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/app/actions";
import { Avatar, Logo, initials } from "./ui";
import { NavLink } from "./client";

export interface NavItem {
  href: string;
  label: string;
  exact?: boolean;
  badge?: number;
}

export function AppShell({ who, subtitle, avatar, avatarTone, nav, children }: {
  who: string;
  subtitle: string;
  avatar?: string;
  avatarTone?: "ink" | "ochre" | "accent";
  nav: NavItem[];
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="sticky top-0 z-20 border-b border-line bg-surface lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col gap-4 px-4 py-3 lg:px-4 lg:py-5">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo />
              <span className="leading-tight">
                <span className="block font-display text-lg font-extrabold">Elo</span>
                <span className="block text-[11px] text-muted">Rede de indústria circular</span>
              </span>
            </Link>
            <form action={signOut} className="lg:hidden">
              <button className="btn btn-ghost btn-sm">Trocar perfil</button>
            </form>
          </div>
          <nav aria-label="Navegação principal" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
            {nav.map((item) => (
              <NavLink key={item.href} href={item.href} exact={item.exact} badge={item.badge}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto hidden border-t border-line pt-4 lg:block">
            <div className="flex items-center gap-2.5">
              <Avatar text={avatar ?? initials(who)} tone={avatarTone} />
              <div className="min-w-0 text-sm leading-tight">
                <p className="truncate font-semibold">{who}</p>
                <p className="truncate text-xs text-muted">{subtitle}</p>
              </div>
            </div>
            <form action={signOut} className="mt-3">
              <button className="btn btn-sm w-full">Trocar perfil</button>
            </form>
          </div>
        </div>
      </aside>
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">{children}</main>
    </div>
  );
}
