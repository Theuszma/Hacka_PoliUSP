import { describe, expect, it } from "vitest";
import { lastPointAnomaly, mad, median, modifiedZ, theilSen, trendOf } from "./stats";

describe("estatística robusta", () => {
  it("mediana e MAD", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(mad([1, 1, 2, 2, 4, 6, 9])).toBe(1);
  });

  it("escore-z modificado segue Iglewicz e Hoaglin", () => {
    // mediana 2, MAD 1 → z = 0,6745 · (9 − 2) / 1
    expect(modifiedZ(9, [1, 1, 2, 2, 4, 6, 9])).toBeCloseTo(4.72, 2);
  });

  it("detecta pico no último mês e ignora ruído", () => {
    const base = [0.27, 0.28, 0.26, 0.27, 0.29, 0.27, 0.28, 0.26, 0.27, 0.28, 0.27];
    expect(lastPointAnomaly([...base, 0.28])).toBeNull();
    const a = lastPointAnomaly([...base, 0.36]);
    expect(a?.direction).toBe("up");
    expect(a?.baseline).toBeCloseTo(0.27, 2);
  });

  it("Theil-Sen resiste a um ponto fora da curva", () => {
    expect(theilSen([1, 2, 3, 4, 100])).toBeCloseTo(1, 5);
    expect(trendOf([0.85, 0.84, 0.86, 0.83, 0.7, 0.62, 0.6, 0.59])?.direction).toBe("down");
    expect(trendOf([0.2, 0.21, 0.2, 0.2, 0.21, 0.2])?.direction).toBe("flat");
  });
});

import { mci } from "./mci";
describe("MCI (Ellen MacArthur, adaptado)", () => {
  it("tudo virgem e sem perda dá 0,55", () => {
    expect(mci([{ mass: 1000, recycledFeed: 0, unrecoveredWaste: 0 }]).mci).toBeCloseTo(0.55, 5);
  });
  it("resíduo para aterro piora e insumo reaproveitado melhora", () => {
    const base = mci([{ mass: 1000, recycledFeed: 0, unrecoveredWaste: 200 }]).mci;
    expect(base).toBeCloseTo(1 - 0.9 * 0.6, 5);
    expect(mci([{ mass: 1000, recycledFeed: 300, unrecoveredWaste: 200 }]).mci).toBeGreaterThan(base);
  });
});

import { companyMci, insightsFor } from "./insights";
describe("motor de diagnóstico", () => {
  const base = { id: "f", name: "Óleo", category: "fluido", unit: "L", monthlyQty: 800, unitCost: 18, destination: "classe1", destinationValue: -2.5, benchmark: 0.2 };
  it("gera alerta de pico e de referência do setor, do mais grave ao menos grave", () => {
    const hist = [0.27, 0.28, 0.26, 0.27, 0.27, 0.28, 0.26, 0.27, 0.28, 0.27, 0.27, 0.35];
    const out = insightsFor([{ ...base, lossRate: 0.35, lossHistory: hist }]);
    expect(out.map((i) => i.kind)).toEqual(["anomaly", "benchmark"]);
    expect(out[0].severity).toBe("alta");
  });
  it("MCI melhora quando o resíduo deixa de ir para aterro", () => {
    const flow = { id: "a", name: "Pallet", category: "madeira", unit: "kg", monthlyQty: 1000, unitCost: 3, lossRate: 0.5, destinationValue: 0 };
    expect(companyMci([{ ...flow, destination: "simbiose" }]).mci).toBeGreaterThan(companyMci([{ ...flow, destination: "aterro" }]).mci);
  });
});
