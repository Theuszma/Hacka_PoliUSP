import type { ReactNode } from "react";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";
import { AppShell } from "./shell";

/** Shell da empresa com contadores de pendências. */
export async function CompanyShell({ user, children }: { user: SessionUser & { company: NonNullable<SessionUser["company"]> }; children: ReactNode }) {
  const companyId = user.company.id;
  const [pendingExchanges, openRequests] = await Promise.all([
    db.exchange.count({ where: { status: "PROPOSED", initiatorId: { not: companyId }, OR: [{ fromId: companyId }, { toId: companyId }] } }),
    db.supportRequest.count({ where: { companyId, status: { not: "DONE" } } }),
  ]);
  return (
    <AppShell
      who={user.company.name}
      subtitle={`${user.name} · ${user.company.city}`}
      avatar={user.company.initials}
      nav={[
        { href: "/empresa", label: "Painel", exact: true },
        { href: "/empresa/insumos", label: "Insumos e resíduos" },
        { href: "/empresa/simulador", label: "Simulador" },
        { href: "/empresa/simbiose", label: "Simbiose industrial", badge: pendingExchanges },
        { href: "/empresa/engenheiros", label: "Engenheiros" },
        { href: "/empresa/demandas", label: "Pedidos de apoio", badge: openRequests },
        { href: "/impacto", label: "Impacto da rede" },
      ]}
    >
      {children}
    </AppShell>
  );
}

export async function EngineerShell({ user, children }: { user: SessionUser & { engineer: NonNullable<SessionUser["engineer"]> }; children: ReactNode }) {
  const open = await db.supportRequest.count({ where: { status: "OPEN" } });
  return (
    <AppShell
      who={user.name}
      subtitle={user.engineer.kind === "MENTOR" ? "Mentor(a) voluntário(a)" : "Estudante · Poli USP"}
      avatarTone={user.engineer.kind === "MENTOR" ? "ochre" : "ink"}
      nav={[
        { href: "/engenheiro", label: "Demandas abertas", exact: true, badge: open },
        { href: "/engenheiro/minhas", label: "Minhas demandas" },
        { href: "/engenheiro/perfil", label: "Meu perfil" },
        { href: "/impacto", label: "Impacto da rede" },
      ]}
    >
      {children}
    </AppShell>
  );
}

/** Escolhe o shell conforme o perfil logado (para páginas compartilhadas). */
export function RoleShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  if (user.role === "COMPANY" && user.company) return <CompanyShell user={user as never}>{children}</CompanyShell>;
  if (user.engineer) return <EngineerShell user={user as never}>{children}</EngineerShell>;
  return <>{children}</>;
}
