import Link from "next/link";
import { requireCompanyUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { category } from "@/lib/catalog";
import { money, relativeDate } from "@/lib/format";
import { Empty, PageHeader, RequestStatus } from "@/components/ui";

export const metadata = { title: "Pedidos de apoio" };

export default async function CompanyRequestsPage() {
  const user = await requireCompanyUser();
  const requests = await db.supportRequest.findMany({
    where: { companyId: user.company.id },
    include: { assignee: { include: { user: true } }, invited: { include: { user: true } }, _count: { select: { updates: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Engenharia" title="Pedidos de apoio técnico" actions={<Link href="/empresa/engenheiros" className="btn btn-primary">Novo pedido</Link>}>
        Acompanhe quem está atuando em cada problema e converse com a equipe.
      </PageHeader>
      {requests.length ? (
        <div className="grid gap-3">
          {requests.map((r) => (
            <Link key={r.id} href={`/demandas/${r.id}`} className="card grid gap-2 transition hover:border-accent sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div className="min-w-0">
                <p className="label">{category(r.category).label}</p>
                <p className="font-semibold">{r.title}</p>
                <p className="text-sm text-muted">
                  {r.assignee ? `Com ${r.assignee.user.name}` : r.invited ? `Convite para ${r.invited.user.name}` : "Aberta para a rede"} · atualizada {relativeDate(r.updatedAt)} · {r._count.updates} registros
                </p>
              </div>
              <div className="flex items-center gap-3 sm:justify-end">
                {r.status === "DONE" && r.savedPerMonth ? <span className="num text-sm text-good">{money(r.savedPerMonth)}/mês economizados</span> : null}
                <RequestStatus status={r.status} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Empty action={<Link href="/empresa/engenheiros" className="btn btn-primary">Encontrar engenheiros</Link>}>Nenhum pedido ainda.</Empty>
      )}
    </div>
  );
}
