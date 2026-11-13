/**
 * Motores de matching do Elo.
 * 1. Simbiose: resíduo de uma empresa ↔ demanda de insumo de outra.
 * 2. Engenharia: engenheiro ↔ problema da empresa (e demanda ↔ engenheiro).
 */
import { category, LOGISTICS } from "./catalog";
import { avoidedPerKg } from "./engine/factors";
import { distanceKm } from "./geo";
import { flowMetrics, rankByLoss, type FlowInput } from "./metrics";

interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface FlowWithCompany extends FlowInput {
  companyId: string;
  company: Place;
}

export interface DemandWithCompany {
  id: string;
  companyId: string;
  company: Place;
  category: string;
  description: string;
  use: string;
  pricePaid: number;
  virginPrice: number;
  capacity: number;
  substitution: number;
  licensed: boolean;
}

export interface SymbiosisMatch {
  flow: FlowWithCompany;
  demand: DemandWithCompany;
  distanceKm: number;
  /** unidades por mês que podem ser trocadas */
  volume: number;
  /** R$/mês de frete (pago por quem envia) */
  freight: number;
  /** R$/mês que quem envia ganha em relação ao destino atual, já descontado o frete */
  senderGain: number;
  /** R$/mês que quem recebe economiza em relação a comprar material novo */
  receiverSaving: number;
  /** kg CO2e/mês evitados (matéria-prima virgem substituída menos transporte) */
  co2Avoided: number;
  /** valor líquido por unidade para quem envia, já com o frete (para o simulador) */
  netUnitValue: number;
}

/** Cruza todos os resíduos com todas as demandas de insumo da rede. */
export function findSymbiosisMatches(flows: FlowWithCompany[], demands: DemandWithCompany[]): SymbiosisMatch[] {
  const matches: SymbiosisMatch[] = [];
  for (const flow of flows) {
    const waste = flowMetrics(flow).wasteQty;
    if (waste <= 0) continue;
    const cat = category(flow.category);
    for (const demand of demands) {
      if (demand.companyId === flow.companyId) continue;
      if (demand.category !== flow.category) continue;
      if (cat.hazardous && !demand.licensed) continue;

      const km = distanceKm(flow.company, demand.company);
      if (km > LOGISTICS.maxRadiusKm) continue;

      const volume = Math.min(waste, demand.capacity);
      const tonKm = ((volume * cat.kgPerUnit) / 1000) * km;
      const freight = tonKm * LOGISTICS.freightPerTonKm;
      const senderGain = (demand.pricePaid - flow.destinationValue) * volume - freight;
      const receiverSaving = (demand.virginPrice - demand.pricePaid) * volume;
      const co2Avoided = volume * cat.kgPerUnit * avoidedPerKg(flow.category, demand.substitution) - tonKm * LOGISTICS.co2PerTonKm;

      // Só vale a pena se a troca gera valor para o conjunto e reduz emissões.
      if (senderGain + receiverSaving <= 0 || co2Avoided <= 0) continue;

      matches.push({
        flow,
        demand,
        distanceKm: km,
        volume,
        freight,
        senderGain,
        receiverSaving,
        co2Avoided,
        netUnitValue: demand.pricePaid - freight / volume,
      });
    }
  }
  return matches.sort((a, b) => b.senderGain + b.receiverSaving - (a.senderGain + a.receiverSaving) || a.distanceKm - b.distanceKm);
}

/** Melhor parceiro para cada fluxo de uma empresa (usado no simulador). */
export function bestMatchByFlow(matches: SymbiosisMatch[], companyId: string): Record<string, SymbiosisMatch> {
  const best: Record<string, SymbiosisMatch> = {};
  for (const m of matches) {
    if (m.flow.companyId !== companyId) continue;
    const cur = best[m.flow.id];
    if (!cur || m.senderGain > cur.senderGain) best[m.flow.id] = m;
  }
  return best;
}

/* ------------------------------------------------------------------ */

export interface EngineerInput {
  id: string;
  skills: string[];
  rating: number;
}

export interface EngineerFit<E extends EngineerInput> {
  engineer: E;
  /** 0..1, quanto do prejuízo da empresa está nas áreas dessa pessoa */
  score: number;
  matchedSkills: string[];
  /** fluxo em que a pessoa mais pode ajudar */
  topFlowId: string | null;
}

export function flowSkills(flow: Pick<FlowInput, "category">): string[] {
  return [...category(flow.category).skills];
}

/** Ordena engenheiros pelo quanto as habilidades cobrem o prejuízo da empresa. */
export function rankEngineers<E extends EngineerInput>(engineers: E[], flows: FlowInput[]): EngineerFit<E>[] {
  const ranked = rankByLoss(flows).filter((r) => r.metrics.loss > 0);
  const total = ranked.reduce((s, r) => s + r.metrics.loss, 0) || 1;

  return engineers
    .map((engineer) => {
      const skills = new Set(engineer.skills.map(normalize));
      const matched = new Set<string>();
      let score = 0;
      let topFlowId: string | null = null;
      let topValue = 0;
      for (const { flow, metrics } of ranked) {
        const overlap = flowSkills(flow).filter((s) => skills.has(normalize(s)));
        if (!overlap.length) continue;
        overlap.forEach((s) => matched.add(s));
        const value = (metrics.loss / total) * Math.min(overlap.length, 2) / 2;
        score += value;
        if (value > topValue) {
          topValue = value;
          topFlowId = flow.id;
        }
      }
      return { engineer, score, matchedSkills: [...matched], topFlowId };
    })
    .sort((a, b) => b.score - a.score || b.engineer.rating - a.engineer.rating);
}

export interface RequestInput {
  id: string;
  category: string;
  monthlyLoss: number;
  company: { lat: number; lng: number };
}

/** Ordena demandas abertas para um engenheiro: aderência às habilidades, depois impacto. */
export function rankRequestsForEngineer<R extends RequestInput>(
  requests: R[],
  engineer: { skills: string[]; lat: number; lng: number },
): { request: R; fit: number; matchedSkills: string[]; distanceKm: number }[] {
  const skills = new Set(engineer.skills.map(normalize));
  return requests
    .map((request) => {
      const needed = category(request.category).skills;
      const matchedSkills = needed.filter((s) => skills.has(normalize(s)));
      return { request, fit: matchedSkills.length / needed.length, matchedSkills, distanceKm: distanceKm(engineer, request.company) };
    })
    .sort((a, b) => b.fit - a.fit || b.request.monthlyLoss - a.request.monthlyLoss);
}

export function parseSkills(raw: string): string[] {
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function normalize(s: string) {
  return s.trim().toLowerCase();
}
