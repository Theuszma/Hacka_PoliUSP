/**
 * Fatores de emissão por categoria de material, em kg CO2e por kg.
 *
 * Fonte: UK DESNZ/DEFRA, "Greenhouse gas reporting: conversion factors 2024",
 * conjunto condensado v1.1 (planilha em docs/fontes/). Valores das abas:
 *   - Material use: produção primária e fonte reciclada em circuito fechado (kg CO2e/t)
 *   - Waste disposal: aterro e combustão (kg CO2e/t)
 *   - Freighting goods: HGV (all diesel), All HGVs, average laden (kg CO2e/t·km)
 * Os valores da planilha estão em kg CO2e por tonelada; aqui dividimos por 1.000.
 *
 * Quando não há linha equivalente na planilha usamos um material próximo (proxy)
 * e dizemos qual; se não houver nenhum, o fator fica marcado como estimativa.
 */

export interface MaterialFactor {
  /** produção primária, cradle-to-gate */
  primary: number;
  /** material de fonte reciclada (closed-loop); null se a planilha não traz */
  recycled: number | null;
  /** destinação em aterro (gate-to-grave) */
  landfill: number;
  /** combustão / incineração (transporte até a planta) */
  combustion: number;
  /** linha da planilha usada */
  reference: string;
  /** fator sem linha oficial equivalente */
  estimate?: boolean;
}

const t = (kgPerTonne: number) => kgPerTonne / 1000;

export const MATERIAL_FACTORS: Record<string, MaterialFactor> = {
  aco: { primary: t(2854.91851), recycled: t(1726.72731), landfill: t(8.88386), combustion: t(6.41061), reference: "Metal: steel cans" },
  aluminio: { primary: t(9106.91851), recycled: t(990.4781), landfill: t(8.88386), combustion: t(6.41061), reference: "Metal: aluminium cans and foil (excl. forming)" },
  plastico: { primary: t(3164.78049), recycled: t(1566.38638), landfill: t(8.88386), combustion: t(6.41061), reference: "Plastics: average plastics" },
  madeira: { primary: t(269.50416), recycled: null, landfill: t(925.24423), combustion: t(6.41061), reference: "Wood (a edição 2024 removeu o fator closed-loop de madeira)" },
  papelao: { primary: t(1193.96586), recycled: t(1092.35486), landfill: t(1164.39015), combustion: t(6.41061), reference: "Paper and board: board" },
  textil: { primary: t(22310), recycled: null, landfill: t(496.68303), combustion: t(6.41061), reference: "Clothing (proxy: a planilha não traz fio ou tecido; tende a superestimar)" },
  fluido: { primary: t(1401), recycled: t(676), landfill: t(6.41061), combustion: t(6.41061), reference: "Mineral oil" },
  tinta: { primary: 3.5, recycled: null, landfill: t(520.3342), combustion: t(6.41061), reference: "Sem linha equivalente; estimativa interna. Descarte: Commercial and industrial waste", estimate: true },
  organico: { primary: t(3701.40359), recycled: null, landfill: t(700.20961), combustion: t(6.41061), reference: "Food and drink · descarte: Organic: food and drink waste" },
};

/** kg CO2e por tonelada·km: HGV (all diesel), All HGVs, average laden. */
export const FREIGHT_CO2_PER_TKM = 0.09752;

export function materialFactor(category: string): MaterialFactor {
  return MATERIAL_FACTORS[category] ?? MATERIAL_FACTORS.aco;
}

/**
 * Emissões evitadas por kg de resíduo que substitui material virgem em outra empresa
 * (método de substituição / expansão do sistema, ISO 14044): diferença entre produzir o
 * material primário e o material de fonte reciclada. Sem fator reciclado, conta só o
 * aterro evitado.
 */
export function avoidedPerKg(category: string, substitution = 1): number {
  const f = materialFactor(category);
  const credit = f.recycled === null ? 0 : Math.max(0, f.primary - f.recycled);
  return credit * substitution + f.landfill;
}
