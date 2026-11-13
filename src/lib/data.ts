import "server-only";
import { db } from "./db";
import { totals } from "./metrics";
import { category } from "./catalog";
import { benchmarkFor } from "./sectors";
import { companyMci, insightsFor } from "./engine/insights";
import { findSymbiosisMatches, type DemandWithCompany, type FlowWithCompany } from "./matching";

const place = { select: { id: true, name: true, lat: true, lng: true } } as const;

/** Todas as possibilidades de simbiose da rede (resíduos × demandas de insumo). */
export async function networkMatches() {
  const [flows, demands] = await Promise.all([
    db.materialFlow.findMany({ include: { company: place } }),
    db.inputDemand.findMany({ include: { company: place } }),
  ]);
  return findSymbiosisMatches(flows as FlowWithCompany[], demands as DemandWithCompany[]);
}

export function companyFlows(companyId: string) {
  return db.materialFlow.findMany({ where: { companyId }, orderBy: { createdAt: "asc" } });
}

export function companyExchanges(companyId: string) {
  return db.exchange.findMany({
    where: { OR: [{ fromId: companyId }, { toId: companyId }] },
    include: { flow: true, demand: true, from: true, to: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function engineersWithUsers() {
  return db.engineer.findMany({ include: { user: true } });
}

/** Série mensal do diagnóstico da empresa, a partir das fotografias mensais de cada fluxo. */
export async function companyHistory(companyId: string, months: string[]) {
  const records = await db.monthlyRecord.findMany({
    where: { flow: { companyId }, month: { in: months } },
    include: { flow: { select: { id: true, name: true, category: true, unit: true } } },
  });
  return months.map((month) => {
    const flows = records.filter((r) => r.month === month).map((r) => ({ ...r, id: r.flow.id, name: r.flow.name, category: r.flow.category, unit: r.flow.unit }));
    return { month, hasData: flows.length > 0, ...totals(flows) };
  });
}

/**
 * Diagnóstico do motor de cálculo para uma empresa: alertas por insumo, MCI e
 * massa de insumo que já vem de resíduo de outras empresas (trocas aceitas recebidas).
 */
export async function companyDiagnosis(companyId: string, sectorKey: string) {
  const [flows, received] = await Promise.all([
    db.materialFlow.findMany({ where: { companyId }, include: { records: { orderBy: { month: "desc" }, take: 24 } }, orderBy: { createdAt: "asc" } }),
    db.exchange.findMany({ where: { toId: companyId, status: "ACCEPTED" }, include: { flow: true } }),
  ]);
  const recycledFeedKg: Record<string, number> = {};
  for (const e of received) {
    const target = flows.find((f) => f.category === e.flow.category);
    if (target) recycledFeedKg[target.id] = (recycledFeedKg[target.id] ?? 0) + e.quantity * category(e.flow.category).kgPerUnit;
  }
  const insightFlows = flows.map((f) => ({
    ...f,
    lossHistory: f.records.length ? f.records.map((r) => r.lossRate).reverse() : [f.lossRate],
    benchmark: benchmarkFor(sectorKey, f.category),
  }));
  return { flows: insightFlows, insights: insightsFor(insightFlows), mci: companyMci(flows, recycledFeedKg), recycledFeedKg };
}
