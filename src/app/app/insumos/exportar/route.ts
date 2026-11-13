import { requireCompanyUser } from "@/lib/auth";
import { category, destination } from "@/lib/catalog";
import { companyFlows } from "@/lib/data";
import { monthKey } from "@/lib/history";
import { flowMetrics } from "@/lib/metrics";

const esc = (v: unknown) => {
  const s = String(v ?? "");
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const n = (v: number, d = 2) => v.toFixed(d).replace(".", ",");

/** Exporta os insumos com o diagnóstico do mês em CSV (separador ;, padrão do Excel em português). */
export async function GET() {
  const user = await requireCompanyUser();
  const flows = await companyFlows(user.company.id);
  const header = ["insumo", "categoria", "unidade", "consumo_mensal", "custo_unitario", "perda_percentual", "destino", "valor_destino", "residuo_mensal", "prejuizo_mensal", "co2e_kg_mensal", "fornecedor", "lote"];
  const rows = flows.map((f) => {
    const m = flowMetrics(f);
    return [f.name, category(f.category).label, f.unit, n(f.monthlyQty, 0), n(f.unitCost), n(f.lossRate * 100, 1), destination(f.destination).label, n(f.destinationValue), n(m.wasteQty, 0), n(m.loss), n(m.embodiedCo2, 0), f.supplier ?? "", f.lot ?? ""];
  });
  const csv = "﻿" + [header, ...rows].map((r) => r.map(esc).join(";")).join("\r\n");
  const slug = user.company.name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="elo-${slug}-${monthKey()}.csv"` },
  });
}
