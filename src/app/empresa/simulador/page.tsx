import { requireCompanyUser } from "@/lib/auth";
import { companyFlows, networkMatches } from "@/lib/data";
import { bestMatchByFlow } from "@/lib/matching";
import { Simulator, type SimFlow } from "@/components/simulator";
import { Empty, PageHeader } from "@/components/ui";

export const metadata = { title: "Simulador" };

export default async function SimulatorPage() {
  const user = await requireCompanyUser();
  const [flows, matches] = await Promise.all([companyFlows(user.company.id), networkMatches()]);
  const best = bestMatchByFlow(matches, user.company.id);
  const simFlows: SimFlow[] = flows.map((f) => ({
    id: f.id, name: f.name, category: f.category, unit: f.unit, monthlyQty: f.monthlyQty, unitCost: f.unitCost,
    lossRate: f.lossRate, destination: f.destination, destinationValue: f.destinationValue,
    leverText: f.leverText, leverReduction: f.leverReduction,
    partner: best[f.id] && f.destination !== "simbiose"
      ? { name: best[f.id].demand.company.name, distanceKm: best[f.id].distanceKm, netUnitValue: best[f.id].netUnitValue, substitution: best[f.id].demand.substitution }
      : null,
  }));

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Cenários “e se”" title="Simulador de economia circular">
        Combine melhorias de processo com trocas de resíduo e veja o efeito no caixa e nas emissões. Os parceiros vêm do matching da rede, com frete já descontado.
      </PageHeader>
      {simFlows.length ? <Simulator flows={simFlows} /> : <Empty>Cadastre insumos para simular cenários.</Empty>}
    </div>
  );
}
