import { requireEngineerUser } from "@/lib/auth";
import { category } from "@/lib/catalog";
import { db } from "@/lib/db";
import { money, num } from "@/lib/format";
import { LogoMark } from "@/components/brand";
import { PrintButton } from "@/components/print-button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const metadata = { title: "Relatório de extensão" };

/** Relatório de atividades de extensão: só entra o que foi validado por mentor(a). */
export default async function ExtensionReport() {
  const user = await requireEngineerUser();
  const e = user.engineer;
  const done = await db.supportRequest.findMany({
    where: { assigneeId: e.id, status: "DONE" },
    include: { company: true, reviewer: { include: { user: true } } },
    orderBy: { reviewedAt: "asc" },
  });
  const hours = done.reduce((s, r) => s + r.estimatedHours, 0);
  const saved = done.reduce((s, r) => s + (r.savedPerMonth ?? 0), 0);
  const companies = new Set(done.map((r) => r.companyId)).size;
  const now = new Date();

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-[13px] text-muted-foreground">Relatório pronto para anexar ao pedido de horas de extensão. Só entram demandas validadas por mentor(a).</p>
        <PrintButton />
      </div>
      <article className="grid min-w-0 grid-cols-1 gap-8 rounded-xl border bg-card p-6 sm:p-10 print:border-0 print:p-0">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-brand">Relatório de atividades de extensão</p>
            <h1 className="mt-1 text-2xl font-semibold">{user.name}</h1>
            <p className="text-[13px] text-muted-foreground">{e.course}</p>
          </div>
          <div className="sm:text-right">
            <LogoMark className="sm:ml-auto" />
            <p className="mt-2 text-xs text-muted-foreground">Emitido em {now.toLocaleDateString("pt-BR")}</p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["Horas de extensão", `${num(hours)} h`],
            ["Projetos validados", String(done.length)],
            ["Indústrias atendidas", String(companies)],
            ["Economia gerada", `${money(saved)}/mês`],
          ].map(([l, v]) => (
            <div key={l} className="rounded-lg border p-3">
              <p className="text-[11px] text-muted-foreground">{l}</p>
              <p className="tabular mt-1 text-lg font-semibold">{v}</p>
            </div>
          ))}
        </section>

        <section className="min-w-0">
          <h2 className="mb-3 border-b pb-2 text-[15px] font-semibold">Atividades</h2>
          {done.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">Nenhuma demanda validada ainda. As atividades aparecem aqui depois da revisão de um(a) mentor(a).</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <THead><TR><TH>Demanda</TH><TH>Indústria</TH><TH className="text-right">Horas</TH><TH className="text-right">Economia</TH><TH>Validação</TH></TR></THead>
                <TBody>
                  {done.map((r) => (
                    <TR key={r.id}>
                      <TD className="min-w-[200px]"><p className="font-medium">{r.title}</p><p className="text-xs text-muted-foreground">{category(r.category).label}</p></TD>
                      <TD className="whitespace-nowrap">{r.company.name}<p className="text-xs text-muted-foreground">{r.company.city}</p></TD>
                      <TD className="tabular text-right">{r.estimatedHours}</TD>
                      <TD className="tabular whitespace-nowrap text-right">{money(r.savedPerMonth ?? 0)}/mês</TD>
                      <TD className="min-w-[160px] text-xs">{r.reviewer ? <>{r.reviewer.user.name}<p className="text-muted-foreground">{(r.reviewedAt ?? r.updatedAt).toLocaleDateString("pt-BR")}</p></> : <span className="text-muted-foreground">sem revisão registrada</span>}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 border-b pb-2 text-[15px] font-semibold">Resultados por atividade</h2>
          <ol className="grid gap-3 text-[13px]">
            {done.map((r, i) => (
              <li key={r.id}><b className="font-medium">{i + 1}. {r.title}</b> <span className="text-muted-foreground">({r.company.name})</span><p className="mt-0.5 text-muted-foreground">{r.outcome}</p></li>
            ))}
          </ol>
        </section>

        <section className="text-xs leading-relaxed text-muted-foreground">
          <p>As horas correspondem ao esforço estimado de cada demanda, publicado pela indústria e aceito pelo(a) estudante. A economia mensal foi conferida e validada pelo(a) mentor(a) indicado(a), que pode ser contatado(a) pela plataforma Elo.</p>
          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            <div className="border-t pt-2">{user.name}<br />Estudante</div>
            <div className="border-t pt-2">Coordenação de extensão<br />Assinatura e carimbo</div>
          </div>
        </section>
      </article>
    </div>
  );
}
