import { requireCompanyUser } from "@/lib/auth";
import { companyFlows, networkMatches } from "@/lib/data";
import { bestMatchByFlow } from "@/lib/matching";
import { rankByLoss } from "@/lib/metrics";
import { PageHeader } from "@/components/shell";
import { Simulator, type SimFlow } from "@/components/simulator";

export const metadata = { title: "Simulador" };

export default async function SimulatorPage() {
  const user = await requireCompanyUser();
  const [flows, matches] = await Promise.all([companyFlows(user.company.id), networkMatches()]);
  const best = bestMatchByFlow(matches, user.company.id);
  const sim: SimFlow[] = rankByLoss(flows).map(({ flow: f }) => {
    const m = best[f.id];
    return {
      id: f.id, name: f.name, category: f.category, unit: f.unit, monthlyQty: f.monthlyQty, unitCost: f.unitCost, lossRate: f.lossRate,
      destination: f.destination, destinationValue: f.destinationValue, leverText: f.leverText, leverReduction: f.leverReduction,
      partner: m && f.destination !== "simbiose" ? { name: m.demand.company.name, distanceKm: m.distanceKm, netUnitValue: m.netUnitValue, substitution: m.demand.substitution, volume: m.volume } : null,
    };
  });
  return (
    <>
      <PageHeader title="Simulador de cenários" description="Teste melhorias de processo e trocas de resíduo antes de investir. Nada aqui altera seus dados." />
      <Simulator flows={sim} />
    </>
  );
}
