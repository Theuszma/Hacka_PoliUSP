import "server-only";
import { db } from "./db";
import { totals } from "./metrics";
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
