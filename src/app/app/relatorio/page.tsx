import { Download } from "lucide-react";
import { requireCompanyUser } from "@/lib/auth";
import { category, destination } from "@/lib/catalog";
import { companyDiagnosis, companyExchanges, companyFlows, companyHistory, networkMatches } from "@/lib/data";
import { SOURCES } from "@/lib/engine/sources";
import { db } from "@/lib/db";
import { money, money2, num, pct, tons } from "@/lib/format";
import { lastMonths, monthLabel } from "@/lib/history";
import { bestMatchByFlow } from "@/lib/matching";
import { flowMetrics, rankByLoss, totals } from "@/lib/metrics";
import { benchmarkFor, sector } from "@/lib/sectors";
import { LogoMark } from "@/components/brand";
import { PrintButton } from "@/components/print-button";
import { buttonVariants } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const metadata = { title: "Relatório do diagnóstico" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 break-inside-avoid">
      <h2 className="mb-3 border-b pb-2 text-[15px] font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default async function ReportPage() {
  const user = await requireCompanyUser();
  const c = user.company;
  const months = lastMonths(12);
  const [flows, history, matches, exchanges, done, diag] = await Promise.all([
    companyFlows(c.id), companyHistory(c.id, months), networkMatches(), companyExchanges(c.id),
    db.supportRequest.findMany({ where: { companyId: c.id, status: "DONE" }, include: { assignee: { include: { user: true } } } }),
    companyDiagnosis(c.id, c.sector),
  ]);
  const t = totals(flows);
  const ranked = rankByLoss(flows);
  const best = bestMatchByFlow(matches, c.id);
  const series = history.filter((h) => h.hasData);
  const now = new Date();
  const active = exchanges.filter((e) => e.status === "ACCEPTED");

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-[13px] text-muted-foreground">Relatório pronto para imprimir ou salvar em PDF. Os números são do mês atual.</p>
        <div className="flex gap-2">
          <a href="/app/insumos/exportar" className={buttonVariants({ variant: "outline", size: "sm" })}><Download />Planilha CSV</a>
          <PrintButton />
        </div>
      </div>

      <article className="grid min-w-0 grid-cols-1 gap-8 rounded-xl border bg-card p-6 sm:p-10 print:border-0 print:p-0">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-brand">Diagnóstico de perdas e circularidade</p>
            <h1 className="mt-1 text-2xl font-semibold">{c.name}</h1>
            <p className="text-[13px] text-muted-foreground">{sector(c.sector).label} · {c.size} empresa, {c.employees} funcionários · {c.city}{c.cnpj ? ` · CNPJ ${c.cnpj}` : ""}</p>
          </div>
          <div className="sm:text-right">
            <LogoMark className="ml-auto" />
            <p className="mt-2 text-xs text-muted-foreground">Emitido em {now.toLocaleDateString("pt-BR")}</p>
          </div>
        </header>

        <Section title="Resumo">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["Prejuízo com resíduos", `${money(t.loss)}/mês`, `${money(t.loss * 12)} por ano`],
              ["Taxa de desperdício", pct(t.wasteRate, 1), `de ${money(t.purchase)} comprados`],
              ["CO₂e no material perdido", `${tons(t.embodiedCo2)}/mês`, `${tons(t.avoidedCo2)} evitados`],
              ["Circularidade (MCI)", diag.mci.mci.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), `${pct(t.circularity)} do resíduo desviado do aterro`],
            ].map(([l, v, h]) => (
              <div key={l} className="rounded-lg border p-3">
                <p className="text-[11px] text-muted-foreground">{l}</p>
                <p className="tabular mt-1 text-lg font-semibold">{v}</p>
                <p className="text-[11px] text-muted-foreground">{h}</p>
              </div>
            ))}
          </div>
          {series.length > 1 && (
            <p className="mt-3 text-[13px] text-muted-foreground">
              Nos últimos {series.length} meses, o prejuízo somou {money(series.reduce((s, h) => s + h.loss, 0))}, variando de {money(Math.min(...series.map((h) => h.loss)))} a {money(Math.max(...series.map((h) => h.loss)))} por mês ({monthLabel(series[0].month)} a {monthLabel(series[series.length - 1].month)}).
            </p>
          )}
        </Section>

        <Section title="Insumos e perdas">
          <div className="overflow-x-auto">
            <Table>
              <THead><TR><TH>Insumo</TH><TH className="text-right">Consumo/mês</TH><TH className="text-right">Perda</TH><TH className="text-right">Setor</TH><TH>Destino</TH><TH className="text-right">Prejuízo/mês</TH></TR></THead>
              <TBody>
                {ranked.map(({ flow: f, metrics: m }) => {
                  const b = benchmarkFor(c.sector, f.category);
                  return (
                    <TR key={f.id}>
                      <TD><p className="font-medium">{f.name}</p><p className="text-xs text-muted-foreground">{category(f.category).label}{f.supplier ? ` · ${f.supplier}` : ""}</p></TD>
                      <TD className="tabular whitespace-nowrap text-right">{num(f.monthlyQty)} {f.unit}</TD>
                      <TD className="tabular text-right">{pct(f.lossRate, 1)}</TD>
                      <TD className="tabular text-right text-muted-foreground">{b !== null ? pct(b) : "—"}</TD>
                      <TD className="whitespace-nowrap">{destination(f.destination).label}</TD>
                      <TD className="tabular whitespace-nowrap text-right font-medium">{money(m.loss)}</TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </div>
        </Section>

        <Section title="Plano de ação recomendado">
          <ol className="grid gap-3 text-[13.5px]">
            {ranked.filter(({ flow }) => flow.leverText || best[flow.id]).slice(0, 5).map(({ flow, metrics }, i) => {
              const mt = best[flow.id];
              return (
                <li key={flow.id} className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand">{i + 1}</span>
                  <div>
                    <p className="font-medium">{flow.name} <span className="font-normal text-muted-foreground">· {money(metrics.loss)}/mês hoje</span></p>
                    {flow.leverText && <p className="text-muted-foreground">Processo: {flow.leverText} (redução típica de {pct(flow.leverReduction ?? 0)}, cerca de {money(metrics.loss * (flow.leverReduction ?? 0) * 0.85)}/mês).</p>}
                    {mt && flow.destination !== "simbiose" && <p className="text-muted-foreground">Destino: vender para {mt.demand.company.name} a {money2(mt.demand.pricePaid)}/{flow.unit}, {num(mt.distanceKm, 1)} km, ganho de {money(mt.senderGain)}/mês com frete.</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </Section>

        {(active.length > 0 || done.length > 0) && (
          <Section title="Resultados já obtidos">
            <ul className="grid gap-2 text-[13.5px]">
              {active.map((e) => <li key={e.id}>Troca ativa: {e.flow.name}, {num(e.quantity)} {e.flow.unit}/mês {e.fromId === c.id ? `para ${e.to.name}` : `de ${e.from.name}`}.</li>)}
              {done.map((r) => <li key={r.id}>Engenharia: {r.title}{r.assignee ? `, com ${r.assignee.user.name}` : ""}. Economia validada de {money(r.savedPerMonth ?? 0)}/mês.</li>)}
            </ul>
          </Section>
        )}

        <Section title="Metodologia e fontes">
          <div className="grid gap-2 text-xs leading-relaxed text-muted-foreground">
            <p>Prejuízo = resíduo × custo unitário − resíduo × valor do destino. CO₂e incorporado = resíduo em kg × fator de produção primária do material; o saldo soma emissões de aterro ou incineração e desconta o que é evitado ao substituir material virgem (método de substituição, ISO 14044). MCI adaptado ao escopo da fábrica: LFI = (V + W) ÷ 2M e MCI = 1 − 0,9 × LFI. Alertas de mês atípico usam o escore-z modificado (|z| ≥ 3,5) e tendências usam o estimador de Theil-Sen.</p>
            <p>As perdas de referência por setor são estimativas internas e ainda precisam ser validadas com dados do setor. A metodologia completa está em /metodologia.</p>
            <ol className="list-decimal space-y-0.5 pl-4">
              {(["defra2024", "iso14044", "emfMci", "iglewicz", "sen", "chertow", "pnrs"] as const).map((k) => <li key={k}>{SOURCES[k].citation}</li>)}
            </ol>
          </div>
        </Section>
      </article>
    </div>
  );
}
