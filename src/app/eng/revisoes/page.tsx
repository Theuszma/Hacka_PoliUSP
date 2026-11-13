import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireEngineerUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { money, relativeDate } from "@/lib/format";
import { PageHeader } from "@/components/shell";
import { Stat } from "@/components/domain";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, EmptyState } from "@/components/ui/misc";

export const metadata = { title: "Revisões" };

export default async function ReviewsPage() {
  const user = await requireEngineerUser();
  if (user.engineer.kind !== "MENTOR") redirect("/eng");
  const [queue, reviewed] = await Promise.all([
    db.supportRequest.findMany({ where: { status: "REVIEW", assigneeId: { not: user.engineer.id } }, include: { company: true, assignee: { include: { user: true } } }, orderBy: { updatedAt: "asc" } }),
    db.supportRequest.findMany({ where: { reviewerId: user.engineer.id, status: "DONE", assigneeId: { not: user.engineer.id } }, include: { company: true, assignee: { include: { user: true } } }, orderBy: { reviewedAt: "desc" } }),
  ]);
  const validated = reviewed.reduce((s, r) => s + (r.savedPerMonth ?? 0), 0);
  const students = new Set(reviewed.map((r) => r.assigneeId)).size;
  return (
    <>
      <PageHeader title="Revisões" description="Entregas de estudantes esperando o seu parecer. A economia só aparece como validada para a empresa depois da revisão de um(a) mentor(a)." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat tone="violet" label="Na fila" value={queue.length} icon={<ShieldCheck />} hint="entregas aguardando revisão" />
        <Stat tone="emerald" label="Economia validada" value={money(validated)} unit="/mês" hint={`${reviewed.length} entregas revisadas`} />
        <Stat tone="sky" label="Estudantes orientados" value={students} hint="com entregas validadas por você" />
      </div>
      <h2 className="mb-3 text-[13px] font-medium text-muted-foreground">Aguardando revisão · {queue.length}</h2>
      {queue.length === 0 ? (
        <EmptyState icon={<ShieldCheck />} title="Nenhuma entrega na fila" description="Quando um(a) estudante concluir uma demanda, ela aparece aqui." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {queue.map((r) => (
            <Link key={r.id} href={`/demandas/${r.id}`} className="group">
              <Card className="h-full p-4 transition group-hover:border-foreground/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.company.name} · entregue {relativeDate(r.updatedAt)}</p>
                  </div>
                  <Badge tone="brand" dot>Em revisão</Badge>
                </div>
                {r.outcome && <p className="mt-3 line-clamp-2 text-[13px] text-muted-foreground">{r.outcome}</p>}
                <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3 text-xs">
                  <span className="flex min-w-0 items-center gap-2"><Avatar name={r.assignee?.user.name ?? "?"} size={22} /><span className="truncate">{r.assignee?.user.name}</span></span>
                  <span className="tabular shrink-0 font-medium">{r.savedPerMonth !== null ? `${money(r.savedPerMonth)}/mês estimados` : ""}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
      {reviewed.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 text-[13px] font-medium text-muted-foreground">Validadas por você · {reviewed.length}</h2>
          <Card className="divide-y">
            {reviewed.map((r) => (
              <Link key={r.id} href={`/demandas/${r.id}`} className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-subtle">
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-medium">{r.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.assignee?.user.name} · {r.company.name}{r.reviewedAt ? ` · ${relativeDate(r.reviewedAt)}` : ""}</p>
                </div>
                <span className="tabular shrink-0 text-[13px] font-medium text-success">{money(r.savedPerMonth ?? 0)}/mês</span>
              </Link>
            ))}
          </Card>
        </>
      )}
    </>
  );
}
