import "server-only";
import { category } from "./catalog";
import { networkMatches } from "./data";
import { db } from "./db";
import { flowMetrics } from "./metrics";
import { sector } from "./sectors";

/** Indicadores agregados da rede, calculados a partir do banco. */
export async function networkImpact() {
  const [companies, engineers, flows, exchanges, done, openReqs, matches] = await Promise.all([
    db.company.findMany({ where: { onboardedAt: { not: null } }, select: { id: true, sector: true } }),
    db.engineer.count(),
    db.materialFlow.findMany(),
    db.exchange.findMany({ where: { status: "ACCEPTED" }, include: { flow: true, demand: true, from: true, to: true }, orderBy: { updatedAt: "desc" } }),
    db.supportRequest.findMany({ where: { status: "DONE" } }),
    db.supportRequest.count({ where: { status: { not: "DONE" } } }),
    networkMatches(),
  ]);

  let divertedKg = 0, exchangeValue = 0, co2Avoided = 0;
  for (const e of exchanges) {
    const cat = category(e.flow.category);
    divertedKg += e.quantity * cat.kgPerUnit;
    exchangeValue += e.quantity * Math.max(0, e.demand.virginPrice - e.price) + e.quantity * Math.max(0, e.price);
    co2Avoided += e.quantity * cat.co2Factor * e.demand.substitution;
  }
  const engineeringHours = done.reduce((s, r) => s + r.estimatedHours, 0);
  const engineeringSavings = done.reduce((s, r) => s + (r.savedPerMonth ?? 0), 0);

  let networkLoss = 0, networkWasteKg = 0, landfillKg = 0;
  for (const f of flows) {
    const m = flowMetrics(f);
    networkLoss += m.loss;
    const kg = m.wasteQty * category(f.category).kgPerUnit;
    networkWasteKg += kg;
    if (!m.circular) landfillKg += kg;
  }
  const taken = new Set(exchanges.map((e) => `${e.flowId}:${e.demandId}`));
  const untapped = matches.filter((m) => m.flow.destination !== "simbiose" && m.senderGain > 0 && !taken.has(`${m.flow.id}:${m.demand.id}`));
  // potencial: melhor troca por fluxo, sem contar o mesmo resíduo duas vezes
  const bestByFlow = new Map<string, number>();
  for (const m of untapped) bestByFlow.set(m.flow.id, Math.max(bestByFlow.get(m.flow.id) ?? 0, m.senderGain + m.receiverSaving));
  const untappedValue = [...bestByFlow.values()].reduce((s, v) => s + v, 0);

  const bySector = new Map<string, number>();
  for (const c of companies) bySector.set(sector(c.sector).label, (bySector.get(sector(c.sector).label) ?? 0) + 1);

  return {
    companies: companies.length, engineers, exchanges, activeExchanges: exchanges.length,
    divertedKg, exchangeValue, co2Avoided, engineeringHours, engineeringSavings, doneRequests: done.length, openRequests: openReqs,
    networkLoss, networkWasteKg, landfillKg, untappedValue, untappedCount: bestByFlow.size,
    sectors: [...bySector.entries()].sort((a, b) => b[1] - a[1]),
  };
}
