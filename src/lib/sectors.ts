/**
 * Setores industriais com insumos típicos e taxas de perda de referência.
 * As referências servem para comparar a empresa com o seu setor (benchmark) e para
 * pré-preencher o onboarding. Cada perda aponta para as fontes em `benchmarkSources`;
 * sem fonte, é uma estimativa declarada (ver docs/REFERENCIAS.md).
 */
import type { CategoryKey, DestinationKey } from "./catalog";
import type { SourceId } from "./engine/sources";

export interface FlowTemplate {
  name: string;
  category: CategoryKey;
  unitCost: number;
  /** perda típica do setor (0..1) */
  benchmarkLoss: number;
  /** fontes da perda de referência; vazio = estimativa */
  benchmarkSources?: readonly SourceId[];
  /** de onde sai o número, em uma frase */
  benchmarkNote?: string;
  destination: DestinationKey;
  destinationValue: number;
  leverText: string;
  leverReduction: number;
}

export interface Sector {
  label: string;
  templates: FlowTemplate[];
}

export const SECTORS = {
  metalurgia: {
    label: "Metalurgia e estamparia",
    templates: [
      { name: "Chapa de aço carbono", category: "aco", unitCost: 7.2, benchmarkLoss: 0.15, benchmarkSources: ["flint2019", "cullenAllwood2013"], benchmarkNote: "Rendimento médio de 85% no corte de chapa (blanking) e na fabricação com aço", destination: "sucata", destinationValue: 1.1, leverText: "Otimizar o encaixe de peças na chapa (nesting) e revisar o formato da bobina", leverReduction: 0.3 },
      { name: "Óleo de corte / estampagem", category: "fluido", unitCost: 18, benchmarkLoss: 0.2, destination: "classe1", destinationValue: -2.5, leverText: "Filtrar e controlar a concentração com refratômetro para estender a vida do fluido", leverReduction: 0.5 },
      { name: "Tinta pó", category: "tinta", unitCost: 38, benchmarkLoss: 0.3, benchmarkSources: ["biller2026", "mohar2016"], benchmarkNote: "Eficiência de primeira passada de 70% a 90% em peças simples e menor em peças vazadas, sem recuperação do overspray", destination: "classe1", destinationValue: -1.8, leverText: "Instalar recuperação de overspray na cabine (ciclone e filtro cartucho)", leverReduction: 0.65 },
      { name: "Pallets de madeira", category: "madeira", unitCost: 2.8, benchmarkLoss: 0.3, destination: "aterro", destinationValue: -0.35, leverText: "Criar logística reversa de pallets com clientes e fornecedores", leverReduction: 0.4 },
      { name: "Filme stretch", category: "plastico", unitCost: 12, benchmarkLoss: 0.8, destination: "aterro", destinationValue: -0.35, leverText: "Trocar o filme por cintas reutilizáveis nas rotas internas", leverReduction: 0.5 },
    ],
  },
  usinagem: {
    label: "Usinagem e autopeças",
    templates: [
      { name: "Barra de aço", category: "aco", unitCost: 8.5, benchmarkLoss: 0.25, benchmarkSources: ["cullenAllwood2013", "ingarao2015"], benchmarkNote: "Estimativa entre a perda média da fabricação com aço (15%) e a de um caso de torneamento (41%)", destination: "sucata", destinationValue: 1.3, leverText: "Ajustar sobremetal e comprar barras em medida mais próxima da peça", leverReduction: 0.25 },
      { name: "Barra de alumínio", category: "aluminio", unitCost: 28, benchmarkLoss: 0.3, benchmarkSources: ["cullenAllwood2013", "ingarao2015"], benchmarkNote: "Estimativa entre a perda média da fabricação com alumínio (18%) e a de um caso de torneamento de barra (41%)", destination: "sucata", destinationValue: 7, leverText: "Separar cavaco por liga para vender com melhor preço e revisar sobremetal", leverReduction: 0.2 },
      { name: "Fluido de usinagem", category: "fluido", unitCost: 17, benchmarkLoss: 0.2, destination: "classe1", destinationValue: -2.5, leverText: "Monitorar concentração e pH e instalar separador de óleo sujo", leverReduction: 0.45 },
      { name: "Pallets PBR", category: "madeira", unitCost: 2.8, benchmarkLoss: 0.3, destination: "aterro", destinationValue: -0.35, leverText: "Pool de pallets retornáveis com clientes", leverReduction: 0.5 },
    ],
  },
  plasticos: {
    label: "Plásticos e borracha",
    templates: [
      { name: "Resina PP", category: "plastico", unitCost: 9.5, benchmarkLoss: 0.05, benchmarkSources: ["mannheim2026"], benchmarkNote: "Refugo tecnológico de 5% na injeção", destination: "reuso", destinationValue: 0, leverText: "Ajustar parâmetros de injeção e manutenção preventiva dos moldes", leverReduction: 0.4 },
      { name: "Resina PEAD", category: "plastico", unitCost: 9, benchmarkLoss: 0.05, benchmarkSources: ["mannheim2026"], benchmarkNote: "Refugo tecnológico de 5% no processamento de PEAD", destination: "reuso", destinationValue: 0, leverText: "Controle estatístico de processo na extrusão", leverReduction: 0.35 },
      { name: "Caixas de papelão", category: "papelao", unitCost: 4.5, benchmarkLoss: 0.4, destination: "reciclagem", destinationValue: 0.4, leverText: "Embalagens retornáveis com clientes recorrentes", leverReduction: 0.4 },
    ],
  },
  textil: {
    label: "Confecção e têxtil",
    templates: [
      { name: "Tecido de algodão", category: "textil", unitCost: 32, benchmarkLoss: 0.15, benchmarkSources: ["rissanen2013"], benchmarkNote: "Cerca de 15% do tecido vira retalho no corte e costura convencional", destination: "aterro", destinationValue: -0.3, leverText: "Encaixe digital de moldes e reaproveitamento de retalhos", leverReduction: 0.3 },
      { name: "Malha de poliéster", category: "textil", unitCost: 26, benchmarkLoss: 0.15, benchmarkSources: ["rissanen2013"], benchmarkNote: "Cerca de 15% do tecido vira retalho no corte e costura convencional", destination: "aterro", destinationValue: -0.3, leverText: "Enfesto automatizado e plano de corte por lote", leverReduction: 0.25 },
      { name: "Sacos plásticos de embalagem", category: "plastico", unitCost: 14, benchmarkLoss: 0.6, destination: "aterro", destinationValue: -0.35, leverText: "Embalagem coletiva por pedido", leverReduction: 0.4 },
    ],
  },
  alimentos: {
    label: "Alimentos e bebidas",
    templates: [
      { name: "Farinha de trigo", category: "organico", unitCost: 3.1, benchmarkLoss: 0.025, benchmarkSources: ["gorynska2021"], benchmarkNote: "Perdas de 2,4% a 2,6% da produção em 48 panificadoras industriais", destination: "aterro", destinationValue: -0.2, leverText: "Planejar produção por dia da semana com base no histórico de vendas", leverReduction: 0.4 },
      { name: "Hortifrúti", category: "organico", unitCost: 4.5, benchmarkLoss: 0.12, benchmarkSources: ["fao2011", "henz2017"], benchmarkNote: "12% na distribuição de frutas e hortaliças na América Latina; 6% a 13% no atacado e varejo no Brasil", destination: "aterro", destinationValue: -0.2, leverText: "Controle FIFO e câmara fria com monitoramento de temperatura", leverReduction: 0.35 },
      { name: "Caixas de papelão", category: "papelao", unitCost: 4.5, benchmarkLoss: 0.5, destination: "reciclagem", destinationValue: 0.4, leverText: "Caixas plásticas retornáveis com fornecedores", leverReduction: 0.5 },
    ],
  },
  moveleiro: {
    label: "Moveleiro e madeira",
    templates: [
      { name: "Chapa de MDF", category: "madeira", unitCost: 6.5, benchmarkLoss: 0.06, benchmarkSources: ["hillig2009"], benchmarkNote: "Aproveitamento médio de 94,3% do MDF em 94 fábricas da Serra Gaúcha", destination: "aterro", destinationValue: -0.35, leverText: "Plano de corte otimizado por software e estoque de sobras catalogado", leverReduction: 0.35 },
      { name: "Verniz e seladora", category: "tinta", unitCost: 30, benchmarkLoss: 0.65, benchmarkSources: ["nescaum"], benchmarkNote: "Pistola convencional transfere só 20% a 40% do verniz para a peça", destination: "classe1", destinationValue: -1.8, leverText: "Pistola HVLP e treinamento de aplicação", leverReduction: 0.4 },
    ],
  },
  ambiental: {
    label: "Reciclagem e serviços ambientais",
    templates: [
      { name: "Embalagens de insumos", category: "plastico", unitCost: 8, benchmarkLoss: 0.5, destination: "reciclagem", destinationValue: 0.5, leverText: "Acordos de retorno de embalagens com fornecedores", leverReduction: 0.4 },
    ],
  },
} as const satisfies Record<string, Sector>;

export type SectorKey = keyof typeof SECTORS;
export const SECTOR_KEYS = Object.keys(SECTORS) as SectorKey[];

export function sector(key: string): Sector {
  return (SECTORS as Record<string, Sector>)[key] ?? SECTORS.metalurgia;
}

/** Perda de referência para um material no setor (se houver template da mesma categoria). */
export function benchmarkTemplate(sectorKey: string, category: string): FlowTemplate | null {
  return sector(sectorKey).templates.find((x) => x.category === category) ?? null;
}

export function benchmarkFor(sectorKey: string, category: string): number | null {
  const t = sector(sectorKey).templates.find((x) => x.category === category);
  return t ? t.benchmarkLoss : null;
}
