import { category, destination } from "./catalog";
import { money, num, pct, tons } from "./format";
import { rankByLoss, totals, type FlowInput } from "./metrics";

interface CompanyInfo {
  name: string;
  sector: string;
  size: string;
  employees: number;
  city: string;
}

/** Texto de briefing gerado a partir do diagnóstico, para o pedido de apoio técnico. */
export function buildBriefing(company: CompanyInfo, flows: (FlowInput & { leverText?: string | null })[], focusFlowId?: string): string {
  const t = totals(flows);
  const ranked = rankByLoss(flows);
  const focus = ranked.find((r) => r.flow.id === focusFlowId) ?? ranked[0];
  const lines = ranked.slice(0, 3).map(
    ({ flow, metrics }, i) =>
      `${i + 1}. ${flow.name}: perda de ${pct(flow.lossRate)} (${num(metrics.wasteQty)} ${flow.unit}/mês), destino: ${destination(flow.destination).label}, prejuízo de ${money(metrics.loss)}/mês.`,
  );
  return [
    `${company.name} · ${company.sector}`,
    `${company.size} empresa, ${company.employees} funcionários, ${company.city}.`,
    "",
    "Situação atual",
    `• Prejuízo com resíduos: ${money(t.loss)}/mês (${pct(t.wasteRate, 1)} do valor comprado em insumos)`,
    `• Circularidade: ${pct(t.circularity)} · CO₂e no desperdício: ${tons(t.embodiedCo2)}/mês`,
    "",
    "Principais perdas",
    ...lines,
    "",
    "O que precisamos",
    focus
      ? `Entender a causa da perda de ${focus.flow.name} (${category(focus.flow.category).label.toLowerCase()}) e propor melhorias com estimativa de investimento e retorno.${focus.flow.leverText ? ` Hipótese inicial: ${focus.flow.leverText.toLowerCase()}.` : ""}`
      : "Avaliar o processo e propor melhorias.",
  ].join("\n");
}
