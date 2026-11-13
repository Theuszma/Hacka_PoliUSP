import "server-only";
import { companyFlows, companyHistory, networkMatches } from "./data";
import { db } from "./db";
import { distanceKm } from "./geo";
import { lastMonths, monthLabel } from "./history";
import { bestMatchByFlow } from "./matching";
import { rankByLoss, totals } from "./metrics";

const SHOWCASE_EMAIL = "rosana@ipiranga.demo";

/** Números reais da empresa de demonstração, para a landing e a tela de login. */
export async function showcase() {
  const user = await db.user.findFirst({ where: { email: SHOWCASE_EMAIL, isDemo: true }, include: { company: true } });
  const company = user?.company;
  if (!company?.onboardedAt) return null;

  const months = lastMonths(12);
  const [flows, history, matches, companies, hours] = await Promise.all([
    companyFlows(company.id),
    companyHistory(company.id, months),
    networkMatches(),
    db.company.findMany({ where: { onboardedAt: { not: null }, id: { not: company.id } }, select: { lat: true, lng: true } }),
    db.supportRequest.aggregate({ where: { companyId: company.id, status: { not: "OPEN" } }, _sum: { estimatedHours: true } }),
  ]);
  if (!flows.length) return null;

  const t = totals(flows);
  const series = history.filter((h) => h.hasData);
  const prev = series.length > 1 ? series[series.length - 2] : null;
  const change = (cur: number, before?: number) => (before ? (cur - before) / before : null);
  const best = bestMatchByFlow(matches, company.id);
  const opportunities = rankByLoss(flows)
    .map(({ flow, metrics }) => {
      const m = best[flow.id];
      const exchange = m && flow.destination !== "simbiose" ? Math.max(0, m.senderGain) : 0;
      const lever = flow.leverReduction ? metrics.loss * flow.leverReduction * 0.85 : 0;
      return exchange >= lever && m
        ? { kind: "exchange" as const, label: `${flow.name} → ${m.demand.company.name}`, value: exchange }
        : { kind: "process" as const, label: flow.name, value: lever };
    })
    .filter((o) => o.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  return {
    name: company.name,
    city: company.city,
    totals: t,
    delta: {
      loss: change(t.loss, prev?.loss),
      wasteRate: prev ? t.wasteRate - prev.wasteRate : null,
      co2: change(t.embodiedCo2, prev?.embodiedCo2),
      circularity: prev ? t.circularity - prev.circularity : null,
    },
    series: series.map((h) => ({ label: monthLabel(h.month), loss: h.loss })),
    opportunities,
    yearLoss: series.reduce((s, h) => s + h.loss, 0),
    partnersNear: companies.filter((c) => distanceKm(company, c) <= 15).length,
    engineeringHours: hours._sum.estimatedHours ?? 0,
    topFlow: rankByLoss(flows).map(({ flow, metrics }) => ({ name: flow.name, lossRate: flow.lossRate, loss: metrics.loss }))[0],
    potential: opportunities.reduce((s, o) => s + o.value, 0),
  };
}
export type Showcase = NonNullable<Awaited<ReturnType<typeof showcase>>>;
