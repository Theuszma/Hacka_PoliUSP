import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { category } from "@/lib/catalog";
import { money, relativeDate } from "@/lib/format";
import { parseSkills } from "@/lib/matching";
import { assignRequest } from "@/app/actions";
import { RoleShell } from "@/components/shells";
import { SubmitButton } from "@/components/client";
import { CompleteForm, UpdateForm } from "@/components/request-forms";
import { Avatar, PageHeader, RequestStatus, Section, initials } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Demanda" };

export default async function RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect("/entrar");
  const r = await db.supportRequest.findUnique({
    where: { id },
    include: {
      company: true,
      assignee: { include: { user: true } },
      invited: { include: { user: true } },
      updates: { include: { author: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!r) notFound();

  const isCompany = user.companyId === r.companyId;
  const isAssignee = !!user.engineer && user.engineer.id === r.assigneeId;
  const canAssign = !!user.engineer && r.status === "OPEN";
  const canWrite = isCompany || isAssignee;
  const mySkills = user.engineer ? parseSkills(user.engineer.skills).map((s) => s.toLowerCase()) : [];
  const needed = category(r.category).skills;

  return (
    <RoleShell user={user}>
      <div className="grid gap-6">
        <Link href={isCompany ? "/empresa/demandas" : user.engineer ? "/engenheiro" : "/"} className="text-sm font-semibold text-muted hover:text-ink">← Voltar</Link>
        <PageHeader eyebrow={`${category(r.category).label} · ${r.company.name}`} title={r.title} actions={<RequestStatus status={r.status} />}>
          {r.company.sector} · {r.company.city} · publicada {relativeDate(r.createdAt)}
        </PageHeader>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="grid content-start gap-4">
            <Section title="Briefing">
              <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-ink">{r.briefing}</pre>
            </Section>

            {r.status === "DONE" && r.outcome && (
              <Section title="Resultado" className="border-good">
                <p className="text-sm">{r.outcome}</p>
                {r.savedPerMonth != null && <p className="num mt-2 text-good">{money(r.savedPerMonth)}/mês · {money(r.savedPerMonth * 12)}/ano</p>}
              </Section>
            )}

            <Section title="Linha do tempo">
              <ol className="grid gap-4">
                {r.updates.map((u) =>
                  u.kind === "EVENT" ? (
                    <li key={u.id} className="flex items-center gap-3 text-xs text-muted">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-line" />
                      <span>{u.body}</span>
                      <span className="ml-auto shrink-0">{relativeDate(u.createdAt)}</span>
                    </li>
                  ) : (
                    <li key={u.id} className="flex gap-3">
                      <Avatar text={initials(u.author?.name ?? "?")} tone={u.author?.role === "COMPANY" ? "accent" : "ink"} />
                      <div className="min-w-0 flex-1 rounded-lg bg-sunken p-3">
                        <p className="mb-1 text-xs text-muted"><b className="text-ink">{u.author?.name ?? "Alguém"}</b> · {relativeDate(u.createdAt)}</p>
                        <p className="whitespace-pre-wrap text-sm">{u.body}</p>
                      </div>
                    </li>
                  ),
                )}
              </ol>
              {canWrite && r.status !== "DONE" && <div className="mt-5 border-t border-line pt-4"><UpdateForm requestId={r.id} /></div>}
            </Section>
          </div>

          <div className="grid content-start gap-4">
            <section className="card grid gap-3">
              <p className="label">Resumo</p>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs text-muted">Prejuízo da empresa</dt><dd className="num">{money(r.monthlyLoss * 12)}/ano</dd></div>
                <div><dt className="text-xs text-muted">Esforço estimado</dt><dd className="num">{r.estimatedHours} h</dd></div>
                <div className="col-span-2"><dt className="text-xs text-muted">Responsável</dt><dd>{r.assignee ? `${r.assignee.user.name} · ${r.assignee.course}` : r.invited ? `Convite para ${r.invited.user.name}` : "Aberta para a rede"}</dd></div>
              </dl>
              <div className="flex flex-wrap gap-1">
                {needed.map((s) => <span key={s} className={`tag ${mySkills.includes(s.toLowerCase()) ? "tag-hit" : ""}`}>{s}</span>)}
              </div>
            </section>

            {canAssign && (
              <form action={assignRequest} className="card grid gap-3 border-accent">
                <input type="hidden" name="id" value={r.id} />
                <p className="text-sm">Ao assumir, você vira responsável pela demanda e a empresa é avisada. As horas contam como extensão.</p>
                <SubmitButton pendingText="Assumindo…">Assumir demanda</SubmitButton>
              </form>
            )}

            {isAssignee && r.status === "IN_PROGRESS" && (
              <Section title="Concluir demanda">
                <CompleteForm requestId={r.id} />
              </Section>
            )}
          </div>
        </div>
      </div>
    </RoleShell>
  );
}
