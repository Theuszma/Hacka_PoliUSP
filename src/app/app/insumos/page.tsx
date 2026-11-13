import { Boxes } from "lucide-react";
import { requireCompanyUser } from "@/lib/auth";
import { category, destination } from "@/lib/catalog";
import { companyFlows, companyHistory } from "@/lib/data";
import { money, money2, num, pct } from "@/lib/format";
import { lastMonths } from "@/lib/history";
import { flowMetrics, totals } from "@/lib/metrics";
import { benchmarkFor } from "@/lib/sectors";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/shell";
import { DestinationBadge } from "@/components/domain";
import { Sparkline } from "@/components/charts";
import { AddFlowButton, FlowActions, ImportDialog } from "@/components/flows-manager";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { cn } from "@/components/ui/cn";

export const metadata = { title: "Insumos e resíduos" };

export default async function FlowsPage() {
  const user = await requireCompanyUser();
  const flows = await companyFlows(user.company.id);
  const months = lastMonths(6);
  const records = await db.monthlyRecord.findMany({ where: { flowId: { in: flows.map((f) => f.id) }, month: { in: months } }, orderBy: { month: "asc" } });
  const t = totals(flows);

  return (
    <>
      <PageHeader
        title="Insumos e resíduos"
        description="Tudo o que a fábrica compra, quanto vira resíduo e para onde vai. É a base do diagnóstico, do marketplace e das recomendações."
        actions={<><ImportDialog /><AddFlowButton /></>}
      />
      {flows.length === 0 ? (
        <EmptyState icon={<Boxes />} title="Nenhum insumo ainda" description="Adicione um a um ou importe a planilha de compras." action={<AddFlowButton />} />
      ) : (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap gap-x-8 gap-y-2 border-b px-5 py-3 text-[13px] text-muted-foreground">
            <span>{flows.length} insumos</span>
            <span>Compras: <b className="tabular text-foreground">{money(t.purchase)}/mês</b></span>
            <span>Prejuízo: <b className="tabular text-foreground">{money(t.loss)}/mês</b></span>
            <span>Desperdício: <b className="tabular text-foreground">{pct(t.wasteRate, 1)}</b></span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Insumo</TH><TH className="text-right">Consumo/mês</TH><TH className="text-right">Perda</TH><TH className="hidden md:table-cell">Destino</TH>
                  <TH className="text-right">Prejuízo/mês</TH><TH className="hidden lg:table-cell">6 meses</TH><TH className="w-10" />
                </TR>
              </THead>
              <TBody>
                {flows.map((f) => {
                  const m = flowMetrics(f);
                  const bench = benchmarkFor(user.company.sector, f.category);
                  const series = months.map((mo) => records.find((r) => r.flowId === f.id && r.month === mo)).filter(Boolean).map((r) => flowMetrics({ ...f, ...r! }).loss);
                  return (
                    <TR key={f.id}>
                      <TD>
                        <p className="font-medium">{f.name}</p>
                        <p className="max-w-[280px] text-xs text-muted-foreground">{category(f.category).label}{f.supplier ? ` · ${f.supplier}` : ""}{f.lot ? ` · lote ${f.lot}` : ""}</p>
                      </TD>
                      <TD className="tabular whitespace-nowrap text-right">{num(f.monthlyQty)} {f.unit}<p className="text-xs text-muted-foreground">{money2(f.unitCost)}/{f.unit}</p></TD>
                      <TD className="tabular whitespace-nowrap text-right">
                        <span className={cn(bench !== null && f.lossRate > bench * 1.05 && "text-danger")}>{pct(f.lossRate, 1)}</span>
                        {bench !== null && <p className="text-xs text-muted-foreground">setor {pct(bench)}</p>}
                      </TD>
                      <TD className="hidden md:table-cell"><DestinationBadge value={f.destination} /><p className="mt-0.5 text-xs text-muted-foreground">{destination(f.destination).circular ? "circular" : "linear"}</p></TD>
                      <TD className="tabular whitespace-nowrap text-right font-medium">{money(m.loss)}<p className="text-xs font-normal text-muted-foreground">{num(m.wasteQty)} {f.unit} de resíduo</p></TD>
                      <TD className="hidden w-28 lg:table-cell">{series.length > 1 ? <Sparkline values={series} /> : <span className="text-xs text-muted-foreground">sem histórico</span>}</TD>
                      <TD><FlowActions flow={f} /></TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </div>
        </Card>
      )}
    </>
  );
}
