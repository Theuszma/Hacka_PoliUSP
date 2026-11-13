import "server-only";
import { db } from "./db";
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
