import { describe, expect, it } from "vitest";
import { findSymbiosisMatches, rankEngineers, rankRequestsForEngineer, type DemandWithCompany, type FlowWithCompany } from "./matching";

const sbc = { id: "a", name: "Metalúrgica", lat: -23.6914, lng: -46.5646 };
const rudge = { id: "b", name: "Ferragens", lat: -23.6610, lng: -46.5720 };
const longe = { id: "c", name: "Campinas", lat: -22.9056, lng: -47.0608 };

const flow = (over: Partial<FlowWithCompany> = {}): FlowWithCompany => ({
  id: "f1", name: "Chapa", category: "aco", unit: "kg", monthlyQty: 18000, unitCost: 7.2, lossRate: 0.22,
  destination: "sucata", destinationValue: 1.1, companyId: "a", company: sbc, ...over,
});
const demand = (over: Partial<DemandWithCompany> = {}): DemandWithCompany => ({
  id: "d1", companyId: "b", company: rudge, category: "aco", description: "Retalhos", use: "Arruelas",
  pricePaid: 3.4, virginPrice: 7.2, capacity: 5000, substitution: 0.9, licensed: false, ...over,
});

describe("findSymbiosisMatches", () => {
  it("encontra troca vantajosa e desconta o frete", () => {
    const [m] = findSymbiosisMatches([flow()], [demand()]);
    expect(m).toBeDefined();
    expect(m.distanceKm).toBeGreaterThan(3);
    expect(m.distanceKm).toBeLessThan(4);
    expect(m.volume).toBeCloseTo(3960);
    expect(m.freight).toBeGreaterThan(0);
    expect(m.senderGain).toBeCloseTo((3.4 - 1.1) * 3960 - m.freight);
    expect(m.receiverSaving).toBeCloseTo((7.2 - 3.4) * 3960);
    expect(m.netUnitValue).toBeLessThan(3.4);
  });

  it("respeita a capacidade de quem recebe", () => {
    const [m] = findSymbiosisMatches([flow()], [demand({ capacity: 1000 })]);
    expect(m.volume).toBe(1000);
  });

  it("ignora categoria diferente, a própria empresa e parceiros fora do raio", () => {
    expect(findSymbiosisMatches([flow()], [demand({ category: "plastico" })])).toHaveLength(0);
    expect(findSymbiosisMatches([flow()], [demand({ companyId: "a", company: sbc })])).toHaveLength(0);
    expect(findSymbiosisMatches([flow()], [demand({ company: longe })])).toHaveLength(0);
  });

  it("só envia resíduo perigoso para destinatário licenciado", () => {
    const oil = flow({ category: "fluido", unit: "L", monthlyQty: 800, unitCost: 18, lossRate: 0.35, destination: "classe1", destinationValue: -2.5 });
    const d = demand({ category: "fluido", pricePaid: -0.8, virginPrice: 9, substitution: 0.7 });
    expect(findSymbiosisMatches([oil], [d])).toHaveLength(0);
    expect(findSymbiosisMatches([oil], [{ ...d, licensed: true }])).toHaveLength(1);
  });
});

describe("rankEngineers", () => {
  const flows = [
    flow(),
    flow({ id: "f2", name: "Óleo", category: "fluido", unit: "L", monthlyQty: 800, unitCost: 18, lossRate: 0.35, destination: "classe1", destinationValue: -2.5 }),
  ];
  it("prioriza quem cobre a maior perda", () => {
    const ranked = rankEngineers(
      [
        { id: "quimica", skills: ["fluidos", "química"], rating: 5 },
        { id: "materiais", skills: ["aço", "nesting"], rating: 4.5 },
        { id: "nada", skills: ["IoT"], rating: 5 },
      ],
      flows,
    );
    expect(ranked.map((r) => r.engineer.id)).toEqual(["materiais", "quimica", "nada"]);
    expect(ranked[0].topFlowId).toBe("f1");
    expect(ranked[2].score).toBe(0);
  });
});

describe("rankRequestsForEngineer", () => {
  it("coloca primeiro as demandas da área da pessoa", () => {
    const reqs = [
      { id: "r1", category: "textil", monthlyLoss: 50000, company: sbc },
      { id: "r2", category: "aco", monthlyLoss: 1000, company: sbc },
    ];
    const ranked = rankRequestsForEngineer(reqs, { skills: ["aço", "conformação"], lat: -23.56, lng: -46.73 });
    expect(ranked[0].request.id).toBe("r2");
    expect(ranked[0].fit).toBeCloseTo(0.5);
  });
});
