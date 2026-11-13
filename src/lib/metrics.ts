/**
 * Indicadores de desperdício e circularidade.
 * Funções puras: recebem dados e devolvem números, sem acessar banco. Usadas no servidor
 * (painéis) e no navegador (simulador).
 */
import { category, destination } from "./catalog";

export interface FlowInput {
  id: string;
  name: string;
  category: string;
  unit: string;
  monthlyQty: number;
  unitCost: number;
  lossRate: number;
  destination: string;
  destinationValue: number;
}

/** Cenário aplicado a um fluxo no simulador. */
export interface FlowScenario {
  /** redução relativa da taxa de perda (0..1) */
  reduction?: number;
  /** destino alternativo (ex.: parceiro de simbiose) */
  alternative?: { destinationValue: number; substitution: number } | null;
}

export interface FlowMetrics {
  /** taxa de perda efetiva (0..1) */
  lossRate: number;
  /** unidades de resíduo por mês */
  wasteQty: number;
  /** R$ por mês gasto em material que virou resíduo */
  materialLost: number;
  /** R$ por mês recebido (+) ou pago (−) no destino do resíduo */
  destinationBalance: number;
  /** R$ por mês: prejuízo líquido com o resíduo */
  loss: number;
  /** kg CO2e por mês incorporados no material desperdiçado */
  embodiedCo2: number;
  /** kg CO2e por mês evitados pelo destino (reciclagem, simbiose) */
  avoidedCo2: number;
  /** R$ por mês comprados desse insumo */
  purchase: number;
  circular: boolean;
}

export function flowMetrics(flow: FlowInput, scenario?: FlowScenario): FlowMetrics {
  const reduction = clamp(scenario?.reduction ?? 0, 0, 1);
  const lossRate = clamp(flow.lossRate, 0, 1) * (1 - reduction);
  const wasteQty = flow.monthlyQty * lossRate;
  const factor = category(flow.category).co2Factor;

  const alt = scenario?.alternative ?? null;
  const destValue = alt ? alt.destinationValue : flow.destinationValue;
  const dest = destination(flow.destination);
  const circular = alt ? true : dest.circular;
  const avoidedShare = alt ? alt.substitution : dest.avoidedShare;

  const materialLost = wasteQty * flow.unitCost;
  const destinationBalance = wasteQty * destValue;
  const embodiedCo2 = wasteQty * factor;

  return {
    lossRate,
    wasteQty,
    materialLost,
    destinationBalance,
    loss: materialLost - destinationBalance,
    embodiedCo2,
    avoidedCo2: embodiedCo2 * avoidedShare,
    purchase: flow.monthlyQty * flow.unitCost,
    circular,
  };
}

export interface Totals {
  purchase: number;
  materialLost: number;
  loss: number;
  wasteQty: number;
  circularQty: number;
  landfillQty: number;
  embodiedCo2: number;
  avoidedCo2: number;
  /** emissões incorporadas no desperdício menos as evitadas */
  netCo2: number;
  /** valor perdido ÷ valor comprado */
  wasteRate: number;
  /** massa de resíduo circular ÷ massa total de resíduo */
  circularity: number;
}

export function totals(flows: FlowInput[], scenarios: Record<string, FlowScenario> = {}): Totals {
  const t = { purchase: 0, materialLost: 0, loss: 0, wasteQty: 0, circularQty: 0, landfillQty: 0, embodiedCo2: 0, avoidedCo2: 0 };
  for (const f of flows) {
    const m = flowMetrics(f, scenarios[f.id]);
    t.purchase += m.purchase;
    t.materialLost += m.materialLost;
    t.loss += m.loss;
    t.wasteQty += m.wasteQty;
    t.embodiedCo2 += m.embodiedCo2;
    t.avoidedCo2 += m.avoidedCo2;
    if (m.circular) t.circularQty += m.wasteQty;
    else t.landfillQty += m.wasteQty;
  }
  return {
    ...t,
    netCo2: t.embodiedCo2 - t.avoidedCo2,
    wasteRate: t.purchase ? t.materialLost / t.purchase : 0,
    circularity: t.wasteQty ? t.circularQty / t.wasteQty : 0,
  };
}

/** Fluxos ordenados do maior para o menor prejuízo. */
export function rankByLoss<F extends FlowInput>(flows: F[]): { flow: F; metrics: FlowMetrics }[] {
  return flows.map((flow) => ({ flow, metrics: flowMetrics(flow) })).sort((a, b) => b.metrics.loss - a.metrics.loss);
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : 0));
}
