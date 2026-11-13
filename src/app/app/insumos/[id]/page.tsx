import { ArrowLeft, Factory, Leaf, Lightbulb, Recycle, TrendingDown } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCompanyUser } from "@/lib/auth";
import { category, destination } from "@/lib/catalog";
import { networkMatches } from "@/lib/data";
import { db } from "@/lib/db";
import { money, money2, num, pct, relativeDate, tons } from "@/lib/format";
import { lastMonths, monthLabel } from "@/lib/history";
import { flowMetrics } from "@/lib/metrics";
import { benchmarkFor } from "@/lib/sectors";
import { PageHeader } from "@/components/shell";
import { DestinationBadge, ExchangeStatusBadge, Stat } from "@/components/domain";
import { LossTrend } from "@/components/charts";
import { FlowDialog } from "@/components/flows-manager";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Avatar, EmptyState, Progress } from "@/components/ui/misc";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { cn } from "@/components/ui/cn";

export const metadata = { title: "Insumo" };

export default async function FlowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCompanyUser();
  const flow = await db.materialFlow.findFirst({
    where: { id, companyId: user.company.id },
    include: { records: { orderBy: { month: "asc" } }, exchanges: { include: { from: true, to: true }, orderBy: { updatedAt: "desc" } } },
  });
  if (!flow) notFound();

  const m = flowMetrics(flow);
  const cat = category(flow.category);
  const bench = benchmarkFor(user.company.sector, flow.category);
  const months = lastMonths(12);
  const records = flow.records.filter((r) => months.includes(r.month));
  const series = records.map((r) => {
    const rm = flowMetrics({ ...flow, ...r });
    return { label: monthLabel(r.month), loss: rm.loss, rate: r.lossRate, waste: rm.wasteQty, month: r.month, record: r };
  });
  const prev = series.length > 1 ? series[series.length - 2] : null;
  const dLoss = prev && prev.loss ? (m.loss - prev.loss) / prev.loss : null;
  const matches = (await networkMatches()).filter((x) => x.flow.id === flow.id && x.senderGain > 0).sort((a, b) => b.senderGain - a.senderGain).slice(0, 4);
  const leverGain = flow.leverReduction ? m.loss * flow.leverReduction * 0.85 : 0;
  const benchGap = bench !== null && flow.lossRate > bench ? (flow.lossRate - bench) * flow.monthlyQty * flow.unitCost : 0;

  return (
    <>
      <Link href="/app/insumos" className="mb-4 inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Insumos e resíduos</Link>
      <PageHeader
        eyebrow={<span className="flex flex-wrap items-center gap-2"><Badge tone="outline">{cat.label}</Badge>{cat.hazardous && <Badge tone="danger">Resíduo Classe I</Badge>}<DestinationBadge value={flow.destination} /></span>}
        title={flow.name}
        description={[flow.supplier && `Fornecedor: ${flow.supplier}`, flow.lot && `Lote ${flow.lot}`, `atualizado ${relativeDate(flow.updatedAt)}`].filter(Boolean).join(" · ")}
        actions={<FlowDialog flow={flow} trigger={<Button size="sm" variant="outline">Editar dados</Button>} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat tone="rose" label="Prejuízo" value={money(m.loss)} unit="/mês" icon={<TrendingDown />} delta={dLoss !== null && Math.abs(dLoss) > 0.005 ? `${dLoss > 0 ? "+" : "−"}${pct(Math.abs(dLoss), 1)} vs. mês anterior` : null} deltaGood={dLoss !== null && dLoss < 0} hint={`${money(m.purchase)} comprados por mês`} />
        <Stat tone="amber" label="Perda" value={pct(flow.lossRate, 1)} icon={<Factory />} hint={bench !== null ? <span className={cn(flow.lossRate > bench * 1.05 ? "text-danger" : "text-success")}>média do setor: {pct(bench)}</span> : "sem referência do setor"} />
        <Stat tone="sky" label="Resíduo gerado" value={num(m.wasteQty)} unit={`${flow.unit}/mês`} icon={<Recycle />} hint={`${num(flow.monthlyQty)} ${flow.unit} comprados a ${money2(flow.unitCost)}`} />
        <Stat tone="emerald" label="CO₂e no material perdido" value={tons(m.embodiedCo2)} unit="/mês" icon={<Leaf />} hint={`${tons(m.avoidedCo2)} evitados no destino atual`} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Histórico de prejuízo" description="Fotografia de cada mês, gravada a cada atualização" />
          <CardBody className="pt-0">
            {series.length > 1 ? <LossTrend data={series} /> : <div className="grid h-[240px] place-items-center rounded-lg bg-subtle text-[13px] text-muted-foreground">O histórico aparece a partir do segundo mês.</div>}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Como reduzir" description="Caminhos identificados pelo Elo" />
          <div className="grid gap-3 px-5 pb-5">
            {flow.leverText && (
              <div className="rounded-lg border p-3">
                <p className="flex items-center gap-1.5 text-xs font-medium text-sky-600 dark:text-sky-400"><Lightbulb className="size-3.5" />Melhoria de processo</p>
                <p className="mt-1 text-[13px]">{flow.leverText}</p>
                <p className="mt-1 text-xs text-muted-foreground">Reduz até {pct(flow.leverReduction ?? 0)} da perda · cerca de <b className="text-success">{money(leverGain)}/mês</b></p>
                <Link href={`/app/engenheiros?flow=${flow.id}`} className={cn(buttonVariants({ size: "sm" }), "mt-3")}>Pedir apoio de engenharia</Link>
              </div>
            )}
            {benchGap > 0 && (
              <div className="rounded-lg bg-warning-soft p-3 text-[13px]">
                Sua perda está {num((flow.lossRate - (bench ?? 0)) * 100, 1)} p.p. acima da média do setor. Chegar na média vale <b>{money(benchGap)}/mês</b>.
              </div>
            )}
            {matches[0] && (
              <div className="rounded-lg border p-3">
                <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"><Recycle className="size-3.5" />Troca de resíduo</p>
                <p className="mt-1 text-[13px]">{matches[0].demand.company.name} paga {money2(matches[0].demand.pricePaid)}/{flow.unit} a {num(matches[0].distanceKm, 1)} km.</p>
                <p className="mt-1 text-xs text-muted-foreground">Ganho de <b className="text-success">{money(matches[0].senderGain)}/mês</b> já com frete</p>
                <Link href="/app/marketplace" className={cn(buttonVariants({ size: "sm", variant: "outline" }), "mt-3")}>Ver no marketplace</Link>
              </div>
            )}
            {!flow.leverText && !matches[0] && benchGap <= 0 && <p className="text-[13px] text-muted-foreground">Nenhuma oportunidade nova para este insumo agora.</p>}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader title="Registros mensais" description="Base de rastreabilidade do insumo" />
          {series.length === 0 ? <div className="px-5 pb-5"><EmptyState title="Sem registros" /></div> : (
            <div className="overflow-x-auto border-t">
              <Table>
                <THead><TR><TH>Mês</TH><TH className="text-right">Consumo</TH><TH className="text-right">Perda</TH><TH>Destino</TH><TH className="text-right">Prejuízo</TH></TR></THead>
                <TBody>
                  {[...series].reverse().map((s) => (
                    <TR key={s.month}>
                      <TD className="font-medium">{s.label}</TD>
                      <TD className="tabular whitespace-nowrap text-right">{num(s.record.monthlyQty)} {flow.unit}</TD>
                      <TD className="tabular text-right">{pct(s.rate, 1)}</TD>
                      <TD className="whitespace-nowrap text-muted-foreground">{destination(s.record.destination).label}</TD>
                      <TD className="tabular whitespace-nowrap text-right">{money(s.loss)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
        </Card>
        <Card>
          <CardHeader title="Parceiros para este resíduo" description={matches.length ? `${matches.length} indústrias da rede aceitam este material` : "Nenhum comprador na rede ainda"} />
          <div className="divide-y border-t">
            {matches.map((x) => (
              <div key={x.demand.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={x.demand.company.name} square size={30} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{x.demand.company.name}</p>
                  <p className="tabular text-xs text-muted-foreground">{num(x.distanceKm, 1)} km · até {num(x.volume)} {flow.unit}/mês · {money2(x.demand.pricePaid)}/{flow.unit}</p>
                </div>
                <span className="tabular text-[13px] font-semibold text-success">+{money(x.senderGain)}</span>
              </div>
            ))}
            {flow.exchanges.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">Troca com {e.fromId === user.company.id ? e.to.name : e.from.name}</p>
                  <p className="tabular text-xs text-muted-foreground">{num(e.quantity)} {flow.unit}/mês a {money2(e.price)} · {relativeDate(e.updatedAt)}</p>
                </div>
                <ExchangeStatusBadge status={e.status} />
              </div>
            ))}
          </div>
          {bench !== null && (
            <div className="border-t px-5 py-4">
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Sua perda × média do setor</span><span className="tabular">{pct(flow.lossRate, 1)} × {pct(bench)}</span></div>
              <Progress value={Math.min(100, (bench / Math.max(flow.lossRate, bench)) * 100)} className="mt-2" />
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
