import Link from "next/link";
import { requireCompanyUser } from "@/lib/auth";
import { companyFlows } from "@/lib/data";
import { money, money2, num, pct, tons } from "@/lib/format";
import { rankByLoss, totals } from "@/lib/metrics";
import { FlowForm } from "@/components/flow-form";
import { DestinationPill, Empty, PageHeader, Section } from "@/components/ui";

export const metadata = { title: "Insumos e resíduos" };

export default async function FlowsPage() {
  const user = await requireCompanyUser();
  const flows = await companyFlows(user.company.id);
  const ranked = rankByLoss(flows);
  const t = totals(flows);

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Rastreabilidade" title="Insumos e resíduos">
        Cada linha é um material que a fábrica compra: quanto entra, quanto vira resíduo e para onde ele vai.
      </PageHeader>

      <Section title="Fluxos de material" aside={`Total: ${money(t.loss)}/mês de prejuízo · ${tons(t.embodiedCo2)} CO₂e/mês`}>
        {flows.length ? (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="table min-w-[860px]">
              <thead>
                <tr>
                  <th>Insumo</th><th className="text-right">Consumo</th><th className="text-right">Custo</th><th className="text-right">Perda</th>
                  <th className="text-right">Resíduo</th><th>Destino</th><th className="text-right">Prejuízo</th><th className="text-right">CO₂e</th><th />
                </tr>
              </thead>
              <tbody>
                {ranked.map(({ flow: f, metrics: m }) => (
                  <tr key={f.id}>
                    <td>
                      <p className="font-semibold">{f.name}</p>
                      <p className="text-xs text-muted">{[f.supplier, f.lot && `lote ${f.lot}`].filter(Boolean).join(" · ") || "Fornecedor não informado"}</p>
                    </td>
                    <td className="num text-right">{num(f.monthlyQty)} {f.unit}</td>
                    <td className="num text-right">{money2(f.unitCost)}</td>
                    <td className="num text-right">{pct(f.lossRate)}</td>
                    <td className="num text-right">{num(m.wasteQty)} {f.unit}</td>
                    <td><DestinationPill value={f.destination} /></td>
                    <td className="num text-right font-semibold">{money(m.loss)}</td>
                    <td className="num text-right">{tons(m.embodiedCo2, 2)}</td>
                    <td className="text-right"><Link href={`/empresa/insumos/${f.id}`} className="btn btn-ghost btn-sm">Editar</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>Nenhum insumo ainda. Use o formulário abaixo para cadastrar o primeiro.</Empty>
        )}
      </Section>

      <Section title="Cadastrar insumo" aside="O diagnóstico é recalculado na hora">
        <FlowForm />
      </Section>
    </div>
  );
}
