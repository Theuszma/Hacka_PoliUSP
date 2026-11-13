import { describe, expect, it } from "vitest";
import { flowMetrics, rankByLoss, totals, type FlowInput } from "./metrics";

const steel: FlowInput = {
  id: "aco", name: "Chapa de aço", category: "aco", unit: "kg",
  monthlyQty: 18000, unitCost: 7.2, lossRate: 0.22, destination: "sucata", destinationValue: 1.1,
};
const film: FlowInput = {
  id: "filme", name: "Filme stretch", category: "plastico", unit: "kg",
  monthlyQty: 300, unitCost: 12, lossRate: 0.9, destination: "aterro", destinationValue: -0.35,
};

describe("flowMetrics", () => {
  it("calcula resíduo, prejuízo e CO2 de um fluxo", () => {
    const m = flowMetrics(steel);
    expect(m.wasteQty).toBeCloseTo(3960);
    expect(m.materialLost).toBeCloseTo(28512);
    expect(m.destinationBalance).toBeCloseTo(4356);
    expect(m.loss).toBeCloseTo(24156);
    expect(m.embodiedCo2).toBeCloseTo(3960 * 2.855);
    // sucata substitui aço primário: (2,855 − 1,727) + aterro evitado, por kg (DEFRA 2024)
    expect(m.avoidedCo2).toBeCloseTo(3960 * (2.85491851 - 1.72672731 + 0.00888386), 1);
    expect(m.disposalCo2).toBe(0);
    expect(m.circular).toBe(true);
  });

  it("custo de descarte aumenta o prejuízo", () => {
    const m = flowMetrics(film);
    expect(m.loss).toBeCloseTo(270 * 12 + 270 * 0.35);
    expect(m.circular).toBe(false);
    expect(m.disposalCo2).toBeCloseTo(270 * 0.00888386, 3);
  });

  it("aplica redução de perda e destino alternativo", () => {
    const m = flowMetrics(steel, { reduction: 0.5, alternative: { destinationValue: 3.4, substitution: 0.9 } });
    expect(m.lossRate).toBeCloseTo(0.11);
    expect(m.wasteQty).toBeCloseTo(1980);
    expect(m.loss).toBeCloseTo(1980 * (7.2 - 3.4));
    expect(m.avoidedCo2).toBeCloseTo(1980 * ((2.85491851 - 1.72672731) * 0.9 + 0.00888386), 1);
  });

  it("limita valores fora da faixa", () => {
    expect(flowMetrics({ ...steel, lossRate: 1.5 }).lossRate).toBe(1);
    expect(flowMetrics(steel, { reduction: -1 }).lossRate).toBeCloseTo(0.22);
  });
});

describe("totals", () => {
  it("soma fluxos e calcula taxa de desperdício e circularidade", () => {
    const t = totals([steel, film]);
    expect(t.purchase).toBeCloseTo(18000 * 7.2 + 300 * 12);
    expect(t.wasteQty).toBeCloseTo(3960 + 270);
    expect(t.circularity).toBeCloseTo(3960 / 4230);
    expect(t.landfillQty).toBeCloseTo(270);
    expect(t.wasteRate).toBeCloseTo((28512 + 3240) / (129600 + 3600));
  });

  it("lida com lista vazia", () => {
    const t = totals([]);
    expect(t.wasteRate).toBe(0);
    expect(t.circularity).toBe(0);
  });
});

describe("rankByLoss", () => {
  it("ordena do maior para o menor prejuízo", () => {
    expect(rankByLoss([film, steel]).map((r) => r.flow.id)).toEqual(["aco", "filme"]);
  });
});
