/**
 * Motor de diagnóstico: junta métricas, histórico e benchmark e devolve alertas
 * explicáveis para cada insumo. Funções puras, sem acesso ao banco.
 */
import { category, destination } from "../catalog";
import { flowMetrics, type FlowInput } from "../metrics";
import { mci, type MciResult } from "./mci";
import { lastPointAnomaly, trendOf, type Anomaly, type Trend } from "./stats";
import type { MethodKey } from "./methods";

export interface InsightFlow extends FlowInput {
  /** perda mensal em ordem cronológica (inclui o mês atual por último) */
  lossHistory: number[];
  /** perda de referência do setor (0..1), se houver */
  benchmark: number | null;
}

export type Severity = "alta" | "media" | "info";

export interface Insight {
  id: string;
  flowId: string;
  flowName: string;
  kind: "anomaly" | "trend" | "benchmark";
  severity: Severity;
  title: string;
  detail: string;
  method: MethodKey;
  /** R$/mês em jogo, para ordenar */
  impact: number;
}

export interface FlowDiagnosis {
  anomaly: Anomaly | null;
  trend: Trend | null;
  /** pontos percentuais acima do benchmark (negativo = melhor que o setor) */
  benchmarkGap: number | null;
  /** R$/mês que seriam economizados chegando ao benchmark */
  benchmarkSavings: number;
}

export function diagnoseFlow(f: InsightFlow): FlowDiagnosis {
  const anomaly = lastPointAnomaly(f.lossHistory);
  const trend = trendOf(f.lossHistory);
  const m = flowMetrics(f);
  const benchmarkGap = f.benchmark === null ? null : f.lossRate - f.benchmark;
  const benchmarkSavings = benchmarkGap !== null && benchmarkGap > 0 && f.lossRate > 0 ? m.loss * (benchmarkGap / f.lossRate) : 0;
  return { anomaly, trend, benchmarkGap, benchmarkSavings };
}

const pp = (v: number) => `${(v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function insightsFor(flows: InsightFlow[]): Insight[] {
  const out: Insight[] = [];
  for (const f of flows) {
    const d = diagnoseFlow(f);
    const loss = flowMetrics(f).loss;
    if (d.anomaly) {
      const up = d.anomaly.direction === "up";
      out.push({
        id: `${f.id}:anomaly`, flowId: f.id, flowName: f.name, kind: "anomaly", method: "anomaly",
        severity: up ? "alta" : "info",
        title: up ? `Perda de ${f.name} disparou este mês` : `Perda de ${f.name} caiu fora do padrão`,
        detail: `${pp(d.anomaly.value)} contra a mediana de ${pp(d.anomaly.baseline)} nos meses anteriores (escore-z ${d.anomaly.z.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}).${up ? " Vale checar vazamento, troca de lote ou parada de máquina." : ""}`,
        impact: up ? loss * (1 - d.anomaly.baseline / d.anomaly.value) : 0,
      });
    } else if (d.trend && d.trend.direction !== "flat") {
      const up = d.trend.direction === "up";
      out.push({
        id: `${f.id}:trend`, flowId: f.id, flowName: f.name, kind: "trend", method: "trend",
        severity: up ? "media" : "info",
        title: up ? `Perda de ${f.name} em alta` : `Perda de ${f.name} em queda`,
        detail: `${up ? "Subiu" : "Caiu"} cerca de ${pp(Math.abs(d.trend.relative))} ao longo de ${f.lossHistory.length} meses.`,
        impact: up ? loss * Math.min(1, Math.abs(d.trend.relative)) : 0,
      });
    }
    if (d.benchmarkGap !== null && d.benchmarkGap > 0.02 && d.benchmarkSavings > 0) {
      out.push({
        id: `${f.id}:benchmark`, flowId: f.id, flowName: f.name, kind: "benchmark", method: "loss",
        severity: d.benchmarkGap > 0.05 ? "media" : "info",
        title: `${f.name} acima da referência do setor`,
        detail: `Perda de ${pp(f.lossRate)} contra ${pp(f.benchmark!)} no setor. Chegar à referência economiza ${brl(d.benchmarkSavings)}/mês.`,
        impact: d.benchmarkSavings,
      });
    }
  }
  const rank: Record<Severity, number> = { alta: 0, media: 1, info: 2 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity] || b.impact - a.impact);
}

/** MCI da empresa a partir dos insumos e do que ela recebe de outras empresas. */
export function companyMci(flows: FlowInput[], recycledFeedKg: Record<string, number> = {}): MciResult & { diverted: number } {
  let waste = 0;
  let circular = 0;
  const inputs = flows.map((f) => {
    const kg = category(f.category).kgPerUnit;
    const wasteKg = flowMetrics(f).wasteQty * kg;
    const isCircular = destination(f.destination).circular;
    waste += wasteKg;
    if (isCircular) circular += wasteKg;
    return { mass: f.monthlyQty * kg, recycledFeed: recycledFeedKg[f.id] ?? 0, unrecoveredWaste: isCircular ? 0 : wasteKg };
  });
  return { ...mci(inputs), diverted: waste ? circular / waste : 0 };
}
