/**
 * Como cada indicador é calculado. É o texto que aparece em "Como calculamos" e na
 * página de metodologia; o código que implementa cada fórmula está indicado em `code`.
 */
import type { SourceId } from "./sources";

export interface Method {
  title: string;
  formula: string;
  explanation: string;
  /** premissas que não vêm de fonte externa e podem ser ajustadas */
  assumptions?: string[];
  sources: SourceId[];
}

export const METHODS = {
  loss: {
    title: "Prejuízo com resíduos",
    formula: "prejuízo = Σ (consumo × perda × custo unitário) − Σ (consumo × perda × valor do destino)",
    explanation: "Valor do material comprado que vira resíduo, menos o que se recebe (ou mais o que se paga) para destinar esse resíduo. É calculado por insumo e somado.",
    sources: ["pnrs"],
  },
  wasteRate: {
    title: "Taxa de desperdício",
    formula: "taxa = valor do material perdido ÷ valor total comprado",
    explanation: "Quanto do dinheiro gasto em insumos sai da fábrica como resíduo.",
    sources: [],
  },
  co2: {
    title: "CO₂e no material perdido",
    formula: "CO₂e incorporado = Σ (resíduo em kg × fator de produção primária)  ·  saldo = incorporado + destinação − evitado",
    explanation: "Emissões geradas para produzir o material que virou resíduo, com fatores por material da tabela oficial DESNZ/DEFRA 2024 (aba Material use). O destino soma emissões de aterro ou incineração (aba Waste disposal). Sucata, reciclagem e simbiose descontam a diferença entre produzir o material primário e o reciclado, pelo método de substituição da ISO 14044. Reuso desconta a produção primária inteira.",
    assumptions: [
      "Aço usa a linha 'Metal: steel cans' e têxtil usa 'Clothing' (proxies mais próximos da tabela).",
      "Tintas não têm linha na tabela: o fator de produção é estimativa interna e está sinalizado.",
      "Frete: HGV a diesel, média de carga (0,0975 kg CO₂e por t·km).",
    ],
    sources: ["defra2024", "iso14044"],
  },
  circularity: {
    title: "Desvio de aterro",
    formula: "desvio = massa de resíduo com destino circular ÷ massa total de resíduo",
    explanation: "Parcela do resíduo que volta para a economia (sucata, reciclagem, simbiose, reuso) em vez de ir para aterro, incineração ou coleta Classe I. Segue a ordem de prioridade da PNRS.",
    sources: ["pnrs", "nbr10004"],
  },
  mci: {
    title: "Indicador de Circularidade de Material (MCI)",
    formula: "LFI = (V + W) ÷ 2M  ·  MCI = 1 − 0,9 × LFI",
    explanation: "Adaptação portão a portão do MCI: M é a massa comprada, V a parte virgem (o que não veio de resíduo de outra empresa) e W o resíduo de processo não recuperado. Vai de 0,55 (tudo virgem e nada perdido) a 1 (insumo reaproveitado e nenhum resíduo perdido).",
    assumptions: ["Utilidade X = 1 (vida útil média do setor).", "Fim de vida do produto vendido fora do escopo, porque a PME não controla esse destino."],
    sources: ["emfMci"],
  },
  anomaly: {
    title: "Alerta de mês fora do padrão",
    formula: "z = 0,6745 × (x − mediana) ÷ MAD  ·  alerta se |z| ≥ 3,5",
    explanation: "Compara a perda do último mês com a mediana dos meses anteriores usando o escore-z modificado, que não se deixa levar por meses atípicos do passado.",
    sources: ["iglewicz"],
  },
  trend: {
    title: "Tendência da perda",
    formula: "inclinação = mediana das inclinações entre todos os pares de meses",
    explanation: "Estimador de Theil-Sen: mostra se a perda está subindo ou caindo, sem ser distorcido por um mês isolado. Variações acumuladas abaixo de 10% contam como estáveis.",
    assumptions: ["Limite de 10% de variação acumulada para considerar tendência."],
    sources: ["sen"],
  },
  opportunity: {
    title: "Economia estimada",
    formula: "melhoria de processo = prejuízo × redução esperada × 85%  ·  troca = resíduo × (preço pago pelo parceiro − valor atual do destino) − frete",
    explanation: "Para cada insumo comparamos a melhor alavanca técnica com a melhor troca de resíduo da rede e mostramos a maior. As trocas seguem a lógica de simbiose industrial: resíduo de uma empresa como insumo de outra próxima.",
    assumptions: ["Taxa de realização de 85% sobre a redução esperada, para não prometer o teto.", "Frete por tonelada-quilômetro em caminhão leve."],
    sources: ["chertow"],
  },
} as const satisfies Record<string, Method>;

export type MethodKey = keyof typeof METHODS;
