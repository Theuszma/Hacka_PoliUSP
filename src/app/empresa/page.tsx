import Link from "next/link";
import { requireCompanyUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { companyFlows, networkMatches } from "@/lib/data";
import { money, pct, tons, num } from "@/lib/format";
import { rankByLoss, totals } from "@/lib/metrics";
import { FlowBars } from "@/components/charts";
import { Empty, Kpi, PageHeader, RequestStatus, Section } from "@/components/ui";

export const metadata = { title: "Painel" };

export default async function CompanyDashboard() {
  const user = await requireCompanyUser();
  const company = user.company;
  const [flows, matches, pending, requests] = await Promise.all([
    companyFlows(company.id),
    networkMatches(),
    db.exchange.findMany({ where: { status: "PROPOSED", initiatorId: { not: company.id }, OR: [{ fromId: company.id }, { toId: company.id }] }, include: { from: true, to: true, flow: true } }),
    db.supportRequest.findMany({ where: { companyId: company.id }, orderBy: { updatedAt: "desc" }, take: 3, include: { assignee: { include: { user: true } } } }),
  ]);

  if (!flows.length) {
    return (
      <div className="grid gap-6">
        <PageHeader eyebrow={company.sector} title={`Olá, ${user.name.split(" ")[0]}`} />
        <Empty action={<Link href="/empresa/insumos" className="btn btn-primary">Cadastrar primeiro insumo</Link>}>
          Cadastre os materiais que a fábrica compra e quanto deles vira resíduo. O diagnóstico aparece aqui na hora.
        </Empty>
      </div>
    );
  }

  const t = totals(flows);
  const top = rankByLoss(flows)[0];
  const myOut = matches.filter((m) => m.flow.companyId === company.id);
  const myIn = matches.filter((m) => m.demand.companyId === company.id);
  const symbiosisGain = Object.values(
    myOut.reduce<Record<string, number>>((acc, m) => ({ ...acc, [m.flow.id]: Math.max(acc[m.flow.id] ?? 0, m.senderGain) }), {}),
  ).reduce((s, v) => s + v, 0) + myIn.reduce((s, m) => s + m.receiverSaving, 0);

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow={`${company.sector} · ${company.city}`} title="Diagnóstico de desperdício">
        Calculado a partir dos {flows.length} insumos cadastrados. Valores mensais.
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi tone="accent" label="Dinheiro que vira resíduo" value={money(t.loss)} unit="/mês" hint={`${money(t.loss * 12)} por ano, já descontada a venda de sucata`} />
        <Kpi label="Taxa de desperdício" value={pct(t.wasteRate, 1)} hint={`do valor comprado em insumos (${money(t.purchase)}/mês)`} />
        <Kpi label="CO₂e no material perdido" value={tons(t.embodiedCo2)} unit="/mês" hint="emissões da produção do material que virou resíduo" />
        <Kpi label="Circularidade" value={pct(t.circularity)} hint={`do resíduo volta para a economia; ${num(t.landfillQty)} kg ou L vão para descarte`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Section title="Para onde vai cada insumo" aside={<Link href="/empresa/insumos" className="font-semibold text-accent hover:underline">Editar insumos</Link>}>
          <FlowBars flows={flows} />
        </Section>
        <div className="grid content-start gap-4">
          <section className="card grid gap-3 border-accent">
            <p className="label">Maior oportunidade</p>
            <h2 className="text-lg font-bold">{top.flow.name}</h2>
            <p className="num text-2xl">{money(top.metrics.loss * 12)}<span className="text-sm text-muted"> /ano</span></p>
            {top.flow.leverText && <p className="text-sm text-muted">{top.flow.leverText}.</p>}
            <div className="flex flex-wrap gap-2">
              <Link href="/empresa/simulador" className="btn">Simular melhoria</Link>
              <Link href={`/empresa/engenheiros?foco=${top.flow.id}`} className="btn btn-primary">Pedir apoio técnico</Link>
            </div>
          </section>
          <section className="card grid gap-2">
            <p className="label">Simbiose na sua região</p>
            <p className="text-sm">
              <b>{myOut.length + myIn.length} trocas possíveis</b> com empresas a até 40 km, somando até{" "}
              <b className="text-good">{money(symbiosisGain * 12)}/ano</b> de ganho ou economia.
            </p>
            {pending.length > 0 && (
              <p className="rounded-lg bg-ochre-soft px-3 py-2 text-sm text-ochre">
                {pending.length === 1 ? "1 proposta espera" : `${pending.length} propostas esperam`} sua resposta.
              </p>
            )}
            <Link href="/empresa/simbiose" className="text-sm font-semibold text-accent hover:underline">Ver parceiros →</Link>
          </section>
        </div>
      </div>

      <Section title="Pedidos de apoio técnico" aside={<Link href="/empresa/demandas" className="font-semibold text-accent hover:underline">Ver todos</Link>}>
        {requests.length ? (
          <ul className="divide-y divide-line">
            {requests.map((r) => (
              <li key={r.id}>
                <Link href={`/demandas/${r.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 hover:text-accent">
                  <span className="min-w-0 font-medium">{r.title}</span>
                  <span className="flex items-center gap-3 text-sm text-muted">
                    {r.assignee ? r.assignee.user.name : "Sem responsável"}
                    <RequestStatus status={r.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty action={<Link href="/empresa/engenheiros" className="btn btn-primary">Encontrar engenheiros</Link>}>
            Nenhum pedido ainda. Estudantes e mentores da Poli podem investigar a causa das suas perdas.
          </Empty>
        )}
      </Section>
    </div>
  );
}
