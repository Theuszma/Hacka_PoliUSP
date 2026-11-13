"use client";

import {
  Bell, BarChart3, Boxes, ClipboardList, FlaskConical, GraduationCap, Inbox, LayoutDashboard, LogOut, Menu as MenuIcon, Recycle, Settings, UserRound, Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { markAllRead, signOut } from "@/app/actions";
import { relativeDate } from "@/lib/format";
import { Logo } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import { cn } from "./ui/cn";
import { Avatar } from "./ui/misc";
import { Dialog, DialogTrigger, Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger, SheetContent } from "./ui/overlay";

const ICONS = {
  dashboard: LayoutDashboard, flows: Boxes, simulator: FlaskConical, market: Recycle, engineers: Users, requests: ClipboardList,
  impact: BarChart3, settings: Settings, inbox: Inbox, mine: GraduationCap, profile: UserRound,
};
export type IconKey = keyof typeof ICONS;
export interface NavItem { href: string; label: string; icon: IconKey; exact?: boolean; badge?: number }
export interface NavSection { title?: string; items: NavItem[] }

function NavLinks({ sections, onNavigate }: { sections: NavSection[]; onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <nav className="grid gap-5" aria-label="Navegação principal">
      {sections.map((s, i) => (
        <div key={i} className="grid gap-0.5">
          {s.title && <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80">{s.title}</p>}
          {s.items.map((item) => {
            const Icon = ICONS[item.icon];
            const active = item.exact ? path === item.href : path === item.href || path.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex h-8 items-center gap-2.5 rounded-md px-2 text-[13px] font-medium transition-colors",
                  active ? "bg-brand-soft text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <Icon className={cn("size-4 shrink-0", active ? "text-brand" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge ? <span className="min-w-5 rounded-full bg-brand px-1.5 text-center text-[10.5px] font-semibold leading-5 text-brand-foreground">{item.badge}</span> : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export interface ShellUser { name: string; email: string; org: string; orgSubtitle: string; isDemo: boolean }

function OrgCard({ user }: { user: ShellUser }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border bg-background p-2 shadow-xs">
      <Avatar name={user.org} size={30} square />
      <div className="min-w-0 leading-tight">
        <p className="truncate text-[13px] font-semibold">{user.org}</p>
        <p className="truncate text-xs text-muted-foreground">{user.orgSubtitle}</p>
      </div>
    </div>
  );
}

export function Sidebar({ sections, user }: { sections: NavSection[]; user: ShellUser }) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-5 border-r bg-subtle px-3 py-4 lg:flex">
      <Logo className="px-2" href="/" />
      <OrgCard user={user} />
      <div className="flex-1 overflow-y-auto"><NavLinks sections={sections} /></div>
      {user.isDemo && (
        <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
          Você está numa <b className="text-foreground">conta de demonstração</b>. <Link href="/cadastro" className="font-medium text-brand hover:underline">Crie a sua</Link> para cadastrar sua fábrica.
        </div>
      )}
    </aside>
  );
}

export function MobileNav({ sections, user }: { sections: NavSection[]; user: ShellUser }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Abrir menu"><MenuIcon /></Button>
      </DialogTrigger>
      <SheetContent title="Menu">
        <div className="flex h-full flex-col gap-5 p-4">
          <Logo />
          <OrgCard user={user} />
          <div className="flex-1 overflow-y-auto"><NavLinks sections={sections} onNavigate={() => setOpen(false)} /></div>
        </div>
      </SheetContent>
    </Dialog>
  );
}

export interface NotificationItem { id: string; title: string; body: string | null; href: string | null; read: boolean; createdAt: string }

export function NotificationsMenu({ items }: { items: NotificationItem[] }) {
  const unread = items.filter((n) => !n.read).length;
  const [pending, start] = useTransition();
  return (
    <Menu onOpenChange={(o) => { if (!o && unread) start(() => markAllRead()); }}>
      <MenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="relative" aria-label={`Notificações${unread ? `, ${unread} não lidas` : ""}`}>
          <Bell />
          {unread > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-brand ring-2 ring-background" />}
        </Button>
      </MenuTrigger>
      <MenuContent className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <p className="text-[13px] font-semibold">Notificações</p>
          {unread > 0 && <span className="text-xs text-muted-foreground">{pending ? "Marcando…" : `${unread} não lidas`}</span>}
        </div>
        <div className="max-h-96 overflow-y-auto p-1">
          {items.length === 0 && <p className="px-3 py-8 text-center text-[13px] text-muted-foreground">Nada por aqui ainda.</p>}
          {items.map((n) => (
            <MenuItem key={n.id} asChild className="items-start py-2">
              <Link href={n.href ?? "#"}>
                <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-brand")} />
                <span className="grid min-w-0 gap-0.5">
                  <span className="text-[13px] font-medium leading-snug">{n.title}</span>
                  {n.body && <span className="truncate text-xs text-muted-foreground">{n.body}</span>}
                  <span className="text-[11px] text-muted-foreground">{relativeDate(new Date(n.createdAt))}</span>
                </span>
              </Link>
            </MenuItem>
          ))}
        </div>
      </MenuContent>
    </Menu>
  );
}

export function UserMenu({ user, settingsHref }: { user: ShellUser; settingsHref: string }) {
  return (
    <Menu>
      <MenuTrigger asChild>
        <button className="rounded-full transition hover:opacity-90" aria-label="Menu da conta"><Avatar name={user.name} size={30} /></button>
      </MenuTrigger>
      <MenuContent className="w-60">
        <MenuLabel className="text-foreground">
          <p className="truncate text-[13px] font-medium">{user.name}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
        </MenuLabel>
        <MenuSeparator />
        <MenuItem asChild><Link href={settingsHref}><Settings />Configurações</Link></MenuItem>
        <MenuItem asChild><Link href="/impacto"><BarChart3 />Impacto da rede</Link></MenuItem>
        <MenuSeparator />
        <MenuItem onSelect={() => signOut()}><LogOut />Sair</MenuItem>
      </MenuContent>
    </Menu>
  );
}

export function TopBar({ sections, user, notifications, settingsHref }: { sections: NavSection[]; user: ShellUser; notifications: NotificationItem[]; settingsHref: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <MobileNav sections={sections} user={user} />
      <Logo className="lg:hidden" />
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <NotificationsMenu items={notifications} />
        <div className="ml-1"><UserMenu user={user} settingsHref={settingsHref} /></div>
      </div>
    </header>
  );
}
