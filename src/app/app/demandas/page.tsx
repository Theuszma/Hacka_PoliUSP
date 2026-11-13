import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { requireCompanyUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { money, relativeDate } from "@/lib/format";
import { PageHeader } from "@/components/shell";
import { RequestStatusBadge } from "@/components/domain";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, EmptyState } from "@/components/ui/misc";

export const metadata = { title: "Demandas" };

export default async function RequestsPage() {
  const user = await requireCompanyUser();
  const requests = await db.supportRequest.findMany({
    where: { companyId: user.company.id },
    include: { assignee: { include: { user: true } }, invited: { include: { user: true } }, _count: { select: { updates: true } } },
    orderBy: { updatedAt: "desc" },
  });
  const saved = requests.reduce((s, r) => s + (r.savedPerMonth ?? 0), 0);
  return (
    <>
      <PageHeader
        title="Demandas de engenharia"
        description={saved > 0 ? `Projetos concluídos já economizam ${money(saved)} por mês.` : "Pedidos de apoio técnico enviados à rede."}
        actions={<Link href="/app/engenheiros" className={buttonVariants({ size: "sm" })}>Nova demanda</Link>}
      />
      {requests.length === 0 ? (
        <EmptyState icon={<ClipboardList />} title="Nenhuma demanda ainda" description="Escolha um engenheiro ou publique uma demanda para a rede." action={<Link href="/app/engenheiros" className={buttonVariants()}>Encontrar engenheiros</Link>} />
      ) : (
        <Card className="divide-y">
          {requests.map((r) => {
            const who = r.assignee ?? r.invited;
            return (
              <Link key={r.id} href={`/demandas/${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 transition hover:bg-subtle">
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {money(r.monthlyLoss)}/mês em jogo · {r.estimatedHours} h · atualizada {relativeDate(r.updatedAt)} · {r._count.updates} atualizações
                  </p>
                </div>
                {who && (
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Avatar name={who.user.name} size={22} />{r.assignee ? who.user.name : `convite: ${who.user.name}`}
                  </span>
                )}
                {r.status === "DONE" && r.savedPerMonth ? <span className="tabular text-xs font-medium text-success">−{money(r.savedPerMonth)}/mês</span> : null}
                <RequestStatusBadge status={r.status} />
              </Link>
            );
          })}
        </Card>
      )}
    </>
  );
}
