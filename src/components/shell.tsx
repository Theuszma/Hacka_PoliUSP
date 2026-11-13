import type { ReactNode } from "react";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";
import { sector } from "@/lib/sectors";
import { Sidebar, TopBar, type NavSection, type NotificationItem, type ShellUser } from "./shell-client";

/** Estrutura da plataforma: barra lateral, barra superior e conteúdo. Escolhe a navegação pelo perfil. */
export async function AppShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  const notifications = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 15 });
  const items: NotificationItem[] = notifications.map((n) => ({ id: n.id, title: n.title, body: n.body, href: n.href, read: !!n.readAt, createdAt: n.createdAt.toISOString() }));

  let sections: NavSection[] = [];
  let shellUser: ShellUser;
  let settingsHref = "/app/configuracoes";

  if (user.role === "COMPANY" && user.company) {
    const cid = user.company.id;
    const [pending, active] = await Promise.all([
      db.exchange.count({ where: { status: "PROPOSED", initiatorId: { not: cid }, OR: [{ fromId: cid }, { toId: cid }] } }),
      db.supportRequest.count({ where: { companyId: cid, status: { not: "DONE" } } }),
    ]);
    sections = [
      { items: [{ href: "/app", label: "Visão geral", icon: "dashboard", exact: true }] },
      {
        title: "Operação",
        items: [
          { href: "/app/insumos", label: "Insumos e resíduos", icon: "flows" },
          { href: "/app/simulador", label: "Simulador", icon: "simulator" },
        ],
      },
      {
        title: "Rede",
        items: [
          { href: "/app/marketplace", label: "Marketplace de resíduos", icon: "market", badge: pending },
          { href: "/app/engenheiros", label: "Engenheiros", icon: "engineers" },
          { href: "/app/demandas", label: "Demandas", icon: "requests", badge: active },
        ],
      },
      { title: "Empresa", items: [{ href: "/impacto", label: "Impacto da rede", icon: "impact" }, { href: "/app/configuracoes", label: "Configurações", icon: "settings" }] },
    ];
    shellUser = { name: user.name, email: user.email, org: user.company.name, orgSubtitle: `${sector(user.company.sector).label}`, isDemo: user.isDemo };
  } else {
    const open = await db.supportRequest.count({ where: { status: "OPEN" } });
    settingsHref = "/eng/perfil";
    sections = [
      { items: [{ href: "/eng", label: "Demandas abertas", icon: "inbox", exact: true, badge: open }] },
      { title: "Meu trabalho", items: [{ href: "/eng/minhas", label: "Minhas demandas", icon: "mine" }, { href: "/eng/perfil", label: "Perfil e horas", icon: "profile" }] },
      { title: "Rede", items: [{ href: "/impacto", label: "Impacto da rede", icon: "impact" }] },
    ];
    shellUser = {
      name: user.name, email: user.email, org: user.name,
      orgSubtitle: user.engineer?.kind === "MENTOR" ? "Mentor(a) voluntário(a)" : "Estudante de engenharia", isDemo: user.isDemo,
    };
    settingsHref = "/eng/perfil";
  }

  return (
    <div className="flex min-h-dvh">
      <Sidebar sections={sections} user={shellUser} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar sections={sections} user={shellUser} notifications={items} settingsHref={settingsHref} />
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-2xl">
        {eyebrow && <div className="mb-1.5 text-xs font-medium text-muted-foreground">{eyebrow}</div>}
        <h1 className="text-[22px] font-semibold leading-tight sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-[13.5px] text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
