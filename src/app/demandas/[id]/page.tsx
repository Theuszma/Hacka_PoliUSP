import { ArrowLeft, CheckCircle2, Circle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { assignRequest } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { category } from "@/lib/catalog";
import { db } from "@/lib/db";
import { money, relativeDate } from "@/lib/format";
import { RequestStatusBadge } from "@/components/domain";
import { ActionButton } from "@/components/forms";
import { CompleteButton, MessageForm, ReviewPanel } from "@/components/request-forms";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/misc";
import { cn } from "@/components/ui/cn";

export default async function RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const r = await db.supportRequest.findUnique({
    where: { id },
    include: {
      company: true,
      assignee: { include: { user: true } },
      invited: { include: { user: true } },
      reviewer: { include: { user: true } },
      updates: { include: { author: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!r) notFound();
  const isCompany = user.companyId === r.companyId;
  const isAssignee = !!user.engineer && user.engineer.id === r.assigneeId;
  const isMentor = user.engineer?.kind === "MENTOR";
  const canReview = isMentor && !isAssignee && r.status === "REVIEW";
  const canAssign = !!user.engineer && r.status === "OPEN";
  const canWrite = (isCompany || isAssignee || canReview) && r.status !== "DONE";
  const studentWork = r.assignee?.kind === "STUDENT";
  const back = isCompany ? "/app/demandas" : isAssignee ? "/eng/minhas" : user.role === "COMPANY" ? "/app" : "/eng";
  const steps = [
    { label: "Publicada", done: true },
    { label: "Em andamento", done: r.status !== "OPEN" },
    ...(studentWork || r.status === "REVIEW" ? [{ label: "Revisão por mentor(a)", done: r.status === "DONE" }] : []),
    { label: "Concluída", done: r.status === "DONE" },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <Link href={back} className="mb-4 inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Voltar</Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2"><RequestStatusBadge status={r.status} /><Badge tone="outline">{category(r.category).label}</Badge></div>
          <h1 className="text-[22px] font-semibold leading-tight">{r.title}</h1>
          <p className="mt-1 text-[13.5px] text-muted-foreground">{r.company.name} · {r.company.city} · publicada {relativeDate(r.createdAt)}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <div className="grid gap-4">
          <Card>
            <CardHeader title="Briefing" description="Gerado a partir do diagnóstico da empresa" />
            <div className="whitespace-pre-wrap px-5 pb-5 text-[13.5px] leading-relaxed text-foreground/90">{r.briefing}</div>
          </Card>

          {r.status === "DONE" && r.outcome && (
            <Card className="border-success/40 bg-success-soft/40">
              <CardHeader title="Resultado" description={r.savedPerMonth ? `Economia validada de ${money(r.savedPerMonth)} por mês` : undefined} />
              <p className="px-5 text-[13.5px]">{r.outcome}</p>
              {r.reviewer && (
                <p className="mx-5 mb-5 mt-3 flex items-center gap-1.5 text-xs text-success"><ShieldCheck className="size-3.5" />
                  {r.reviewer.id === r.assigneeId ? `Executada e validada por ${r.reviewer.user.name}, mentor(a)` : `Validada por ${r.reviewer.user.name}, mentor(a) · ${r.reviewer.course}`}
                </p>
              )}
              {!r.reviewer && <div className="pb-5" />}
            </Card>
          )}

          {r.status === "REVIEW" && r.outcome && (
            <Card className="border-brand/30 bg-brand-soft/40">
              <CardHeader title="Entrega em revisão" description={r.savedPerMonth !== null ? `Economia estimada pelo(a) estudante: ${money(r.savedPerMonth)} por mês` : undefined} />
              <p className="px-5 pb-5 text-[13.5px]">{r.outcome}</p>
            </Card>
          )}

          <Card>
            <CardHeader title="Atividade" description={`${r.updates.length} registros`} />
            <ol className="grid gap-0 px-5 pb-2">
              {r.updates.map((u, i) => (
                <li key={u.id} className="relative flex gap-3 pb-5">
                  {i < r.updates.length - 1 && <span className="absolute left-[13px] top-8 bottom-0 w-px bg-border" />}
                  {u.kind === "EVENT" || !u.author ? (
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted"><Circle className="size-2.5 fill-muted-foreground text-muted-foreground" /></span>
                  ) : <Avatar name={u.author.name} size={28} />}
                  <div className="min-w-0 flex-1 pt-1">
                    {u.kind === "EVENT" || !u.author ? (
                      <p className="text-[13px] text-muted-foreground">{u.body} · <span className="text-xs">{relativeDate(u.createdAt)}</span></p>
                    ) : (
                      <>
                        <p className="text-[13px]"><b className="font-medium">{u.author.name}</b> <span className="text-xs text-muted-foreground">{relativeDate(u.createdAt)}</span></p>
                        <div className={cn("mt-1 whitespace-pre-wrap rounded-lg px-3 py-2 text-[13.5px]", u.authorId === user.id ? "bg-brand-soft" : "bg-subtle")}>{u.body}</div>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ol>
            {canWrite && <div className="border-t p-4"><MessageForm id={r.id} /></div>}
            {!canWrite && r.status !== "DONE" && <p className="border-t px-5 py-3 text-xs text-muted-foreground">Só a empresa, quem assumiu a demanda e mentores (durante a revisão) podem escrever aqui.</p>}
          </Card>
        </div>

        <div className="grid gap-4 lg:sticky lg:top-20">
          <Card className="p-5">
            <ol className="grid gap-3">
              {steps.map((s) => (
                <li key={s.label} className="flex items-center gap-2.5 text-[13px]">
                  {s.done ? <CheckCircle2 className="size-4 text-success" /> : <Circle className="size-4 text-muted-foreground/50" />}
                  <span className={cn(!s.done && "text-muted-foreground")}>{s.label}</span>
                </li>
              ))}
            </ol>
            <dl className="mt-5 grid grid-cols-2 gap-y-2 border-t pt-4 text-[13px]">
              <dt className="text-muted-foreground">Em jogo</dt><dd className="tabular text-right font-medium">{money(r.monthlyLoss)}/mês</dd>
              <dt className="text-muted-foreground">Esforço</dt><dd className="tabular text-right">{r.estimatedHours} h</dd>
              <dt className="text-muted-foreground">Empresa</dt><dd className="truncate text-right">{r.company.size}, {r.company.employees} pessoas</dd>
            </dl>
            {canAssign && (
              <ActionButton className="mt-5 w-full" variant="brand" action={assignRequest} fields={{ id: r.id }}>Assumir demanda</ActionButton>
            )}
            {isAssignee && r.status === "IN_PROGRESS" && <div className="mt-5"><CompleteButton id={r.id} mentor={isMentor} /></div>}
            {isAssignee && r.status === "REVIEW" && <p className="mt-5 rounded-lg bg-brand-soft p-3 text-xs text-brand">Entrega enviada. Aguardando a revisão de um(a) mentor(a).</p>}
          </Card>
          {canReview && (
            <Card className="border-brand/40 p-5">
              <p className="mb-1 flex items-center gap-1.5 text-[13.5px] font-medium"><ShieldCheck className="size-4 text-brand" />Revisão de mentor(a)</p>
              <p className="mb-4 text-xs text-muted-foreground">Confira o resultado e a economia antes de validar. Ao validar, a empresa recebe o selo e as horas vão para o perfil do(a) estudante.</p>
              <ReviewPanel id={r.id} estimated={r.savedPerMonth} />
            </Card>
          )}
          {(r.assignee || r.invited) && (
            <Card className="p-5">
              <p className="mb-3 text-xs font-medium text-muted-foreground">{r.assignee ? "Responsável" : "Convidado(a)"}</p>
              {(() => {
                const p = (r.assignee ?? r.invited)!;
                return (
                  <div className="flex items-center gap-3">
                    <Avatar name={p.user.name} size={36} />
                    <div className="min-w-0"><p className="text-[13.5px] font-medium">{p.user.name}</p><p className="truncate text-xs text-muted-foreground">{p.course}</p></div>
                  </div>
                );
              })()}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
