import { ArrowRight, Factory, Leaf, Recycle, TrendingDown, Sparkles, Handshake, Users } from "lucide-react";
import Link from "next/link";
import { requireCompanyUser } from "@/lib/auth";
import { category, destination } from "@/lib/catalog";
import { companyExchanges, companyFlows, companyHistory, networkMatches } from "@/lib/data";
import { db } from "@/lib/db";
import { money, num, pct, tons } from "@/lib/format";
import { lastMonths, monthLabel } from "@/lib/history";
import { bestMatchByFlow } from "@/lib/matching";
import { flowMetrics, rankByLoss, totals } from "@/lib/metrics";
import { benchmarkFor, sector } from "@/lib/sectors";
import { PageHeader } from "@/components/shell";
import { Stat, DestinationBadge, ExchangeStatusBadge } from "@/components/domain";
import { DestinationDonut, LossByMaterial, LossTrend } from "@/components/charts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState, Progress } from "@/components/ui/misc";
import { cn } from "@/components/ui/cn";

export const metadata = { title: "Visão geral" };

function delta(cur: number, prev: number | undefined) {
  if (!prev) return null;
  const d = (cur - prev) / prev;
  if (Math.abs(d) < 0.005) return null;
  return { text: `${d > 0 ? "+" : "−"}${pct(Math.abs(d), 1)} vs. mês anterior`, down: d < 0 };
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ bemvindo?: string }> }) {
  const { bemvindo } = await searchParams;
  const user = await requireCompanyUser();
  const company = user.company;
  const months = lastMonths(12);
  const [flows, history, matches, exchanges, requests] = await Promise.all([
    companyFlows(company.id),
    companyHistory(company.id, months),
    networkMatches(),
    companyExchanges(company.id),
    db.supportRequest.findMany({ where: { companyId: company.id, status: { not: "DONE" } }, include: { assignee: { include: { user: true } } }, orderBy: { updatedAt: "desc" }, take: 3 }),
  ]);

  if (flows.length === 0) {
    return (
      <>
        <PageHeader title={`Olá, ${user.name.split(" ")[0]}`} description={company.name} />
        <EmptyState icon={<Factory />} title="Nenhum insumo cadastrado" description="Cadastre o que a fábrica compra e quanto vira resíduo para gerar o diagnóstico." action={<Link href="/app/insumos" className={buttonVariants()}>Cadastrar insumos</Link>} />
      </>
    );
  }

  const t = totals(flows);
  const withData = history.filter((h) => h.hasData);
  const prev = withData.length > 1 ? withData[withData.length - 2] : undefined;
  const dLoss = delta(t.loss, prev?.loss);
  const dRate = delta(t.wasteRate, prev?.wasteRate);
  const dCo2 = delta(t.embodiedCo2, prev?.embodiedCo2);
  const trend = history.filter((h) => h.hasData).map((h) => ({ label: monthLabel(h.month), loss: h.loss, rate: h.wasteRate }));
  const yearLoss = withData.reduce((s, h) => s + h.loss, 0);

  const ranked = rankByLoss(flows);
  const best = bestMatchByFlow(matches, company.id);
  const sec = sector(company.sector);

  const destMap = new Map<string, { value: number; circular: boolean }>();
  for (const f of flows) {
    const m = flowMetrics(f);
    const d = destination(f.destination);
    const cur = destMap.get(d.label) ?? { value: 0, circular: d.circular };
    cur.value += m.wasteQty * category(f.category).kgPerUnit;
    destMap.set(d.label, cur);
  }
  const donut = [...destMap.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.value - a.value);

  // Oportunidades: alavanca técnica e troca de resíduo para os 3 maiores prejuízos
  const opportunities = ranked.slice(0, 4).map(({ flow, metrics }) => {
    const match = best[flow.id];
    const lever = flow.leverReduction ? metrics.loss * flow.leverReduction * 0.85 : 0;
    const exchange = match ? Math.max(0, match.senderGain) : 0;
    const bench = benchmarkFor(company.sector, flow.category);
    return { flow, metrics, match, lever, exchange, bench };
  }).filter((o) => o.lever > 0 || o.exchange > 0);
  const potential = opportunities.reduce((s, o) => s + Math.max(o.lever, o.exchange), 0);

  const pending = exchanges.filter((e) => e.status === "PROPOSED" && e.initiatorId !== company.id);
  const active = exchanges.filter((e) => e.status === "ACCEPTED");

  return (
    <>
      {bemvindo && (
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-brand/30 bg-brand-soft p-4 sm:p-5">
          <div className="grid size-10 place-items-center rounded-full bg-brand text-brand-foreground"><Sparkles className="size-5" /></div>
          <div className="min-w-0 flex-1">
            <p className="font-medium">Seu diagnóstico está pronto</p>
            <p className="text-[13px] text-muted-foreground">Encontramos {opportunities.length} oportunidades que somam até {money(potential)}/mês. Veja abaixo e no marketplace de resíduos.</p>
          </div>
          <Link href="/app/marketplace" className={buttonVariants({ variant: "brand", size: "sm" })}>Ver parceiros<ArrowRight /></Link>
        </div>
      )}

      <PageHeader
        eyebrow={`${sec.label} · ${company.city}`}
        title="Visão geral"
        description={`Diagnóstico de ${monthLabel(months[months.length - 1])} com ${flows.length} insumos monitorados.`}
        actions={<>
          <Link href="/app/insumos" className={buttonVariants({ variant: "outline", size: "sm" })}>Atualizar dados</Link>
          <Link href="/app/simulador" className={buttonVariants({ size: "sm" })}>Simular melhorias</Link>
        </>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Prejuízo com resíduos" value={money(t.loss)} unit="/mês" icon={<TrendingDown />} delta={dLoss?.text} deltaGood={dLoss?.down} hint={!dLoss && `${money(yearLoss)} nos últimos 12 meses`} />
        <Stat label="Taxa de desperdício" value={pct(t.wasteRate, 1)} icon={<Factory />} delta={dRate?.text} deltaGood={dRate?.down} hint={!dRate && `de ${money(t.purchase)} comprados`} />
        <Stat label="CO₂e no material perdido" value={tons(t.embodiedCo2)} unit="/mês" icon={<Leaf />} delta={dCo2?.text} deltaGood={dCo2?.down} hint={!dCo2 && `${tons(t.avoidedCo2)} evitados no destino`} />
        <Stat label="Circularidade" value={pct(t.circularity)} icon={<Recycle />} hint={<Progress value={t.circularity * 100} className="mt-1 w-full" />} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Prejuízo mensal com resíduos" description={trend.length > 1 ? "Últimos 12 meses, a partir do histórico de cada insumo" : "O histórico aparece conforme você atualiza os dados a cada mês"} />
          <CardBody className="pt-0">
            {trend.length > 1 ? <LossTrend data={trend} /> : <div className="grid h-[240px] place-items-center rounded-lg bg-subtle text-[13px] text-muted-foreground">Primeiro mês registrado: {money(t.loss)}</div>}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Destino do resíduo" description={`${tons(t.wasteQty)} por mês`} />
          <CardBody className="pt-0"><DestinationDonut data={donut} /></CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Onde está o prejuízo" description="Insumos ordenados pelo valor perdido, comparados à perda média do setor"
            action={<Link href="/app/insumos" className={buttonVariants({ variant: "ghost", size: "sm" })}>Ver todos</Link>} />
          <div className="divide-y">
            {ranked.slice(0, 5).map(({ flow, metrics }) => {
              const bench = benchmarkFor(company.sector, flow.category);
              const above = bench !== null && flow.lossRate > bench * 1.05;
              return (
                <div key={flow.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium">{flow.name}</p>
                    <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      <span>perda de {pct(flow.lossRate)}</span>
                      {bench !== null && <span className={cn(above ? "text-danger" : "text-success")}>· setor {pct(bench)}</span>}
                      <span>· {destination(flow.destination).label}</span>
                    </p>
                  </div>
                  <p className="tabular text-right text-[13.5px] font-semibold">{money(metrics.loss)}<span className="font-normal text-muted-foreground">/mês</span></p>
                  <div className="col-span-2"><Progress value={(metrics.loss / (ranked[0].metrics.loss || 1)) * 100}  /></div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Oportunidades" description={potential > 0 ? `Até ${money(potential)}/mês de economia identificada` : "Sem oportunidades novas no momento"} />
          <div className="grid gap-2 px-5 pb-5">
            {opportunities.length === 0 && <p className="text-[13px] text-muted-foreground">Cadastre mais insumos ou o que você aceita receber para o Elo encontrar oportunidades.</p>}
            {opportunities.map((o) => {
              const byExchange = o.exchange >= o.lever && o.match;
              return (
                <Link key={o.flow.id} href={byExchange ? "/app/marketplace" : `/app/engenheiros?flow=${o.flow.id}`} className="group rounded-lg border p-3 transition hover:border-foreground/20 hover:bg-subtle">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Badge tone={byExchange ? "brand" : "info"}>{byExchange ? "Troca de resíduo" : "Melhoria de processo"}</Badge>
                      <p className="mt-1.5 text-[13px] font-medium">{o.flow.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {byExchange && o.match ? `${o.match.demand.company.name} a ${num(o.match.distanceKm, 1)} km paga ${money(o.match.demand.pricePaid)}/${o.flow.unit}` : o.flow.leverText}
                      </p>
                    </div>
                    <p className="tabular shrink-0 text-[13px] font-semibold text-success">+{money(Math.max(o.lever, o.exchange))}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Trocas de resíduo" description={`${active.length} ativas · ${pending.length} aguardando sua resposta`} action={<Link href="/app/marketplace" className={buttonVariants({ variant: "ghost", size: "sm" })}>Marketplace</Link>} />
          {active.length + pending.length === 0 ? (
            <div className="px-5 pb-5"><EmptyState icon={<Handshake />} title="Nenhuma troca ainda" description="Proponha uma troca no marketplace para transformar resíduo em receita." className="py-6" /></div>
          ) : (
            <div className="divide-y">
              {[...pending, ...active].slice(0, 4).map((e) => {
                const other = e.fromId === company.id ? e.to : e.from;
                return (
                  <div key={e.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-medium">{e.flow.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{e.fromId === company.id ? "para" : "de"} {other.name} · {num(e.quantity)} {e.flow.unit}/mês</p>
                    </div>
                    <ExchangeStatusBadge status={e.status} waitingMe={e.status === "PROPOSED" && e.initiatorId !== company.id} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
        <Card>
          <CardHeader title="Demandas de engenharia" description="Apoio técnico em andamento" action={<Link href="/app/engenheiros" className={buttonVariants({ variant: "ghost", size: "sm" })}>Pedir apoio</Link>} />
          {requests.length === 0 ? (
            <div className="px-5 pb-5"><EmptyState icon={<Users />} title="Nenhuma demanda aberta" description="Estudantes e mentores da Poli podem atacar sua maior perda." className="py-6" /></div>
          ) : (
            <div className="divide-y">
              {requests.map((r) => (
                <Link key={r.id} href={`/demandas/${r.id}`} className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-subtle">
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-medium">{r.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.assignee ? `com ${r.assignee.user.name}` : "aguardando engenheiro(a)"} · {money(r.monthlyLoss)}/mês em jogo</p>
                  </div>
                  <Badge tone={r.status === "OPEN" ? "warning" : "info"} dot>{r.status === "OPEN" ? "Aberta" : "Em andamento"}</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="Prejuízo por material" description="Valor perdido por mês em cada insumo" />
        <CardBody className="pt-0"><LossByMaterial data={ranked.slice(0, 8).map(({ flow, metrics }) => ({ name: flow.name, loss: Math.max(0, metrics.loss) }))} /></CardBody>
      </Card>
    </>
  );
}
