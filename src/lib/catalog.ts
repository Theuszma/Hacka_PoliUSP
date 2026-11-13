/**
 * Catálogo de domínio: categorias de material e destinos de resíduo.
 * Fatores de emissão (kg CO2e por unidade de material virgem) vêm de
 * engine/factors.ts (DESNZ/DEFRA 2024); para fluidos o valor por kg foi convertido por litro.
 */

export type Unit = "kg" | "L" | "un";

export interface Category {
  label: string;
  unit: Unit;
  /** kg CO2e por unidade de material virgem produzido */
  co2Factor: number;
  /** resíduo perigoso (Classe I, NBR 10004) exige destinatário licenciado */
  hazardous: boolean;
  /** áreas técnicas que ajudam a reduzir perdas desse material */
  skills: string[];
  /** massa aproximada em kg por unidade, para frete */
  kgPerUnit: number;
}

export const CATEGORIES = {
  aco: { label: "Aço e chapas metálicas", unit: "kg", co2Factor: 2.855, hazardous: false, skills: ["aço", "nesting", "conformação", "estamparia"], kgPerUnit: 1 },
  aluminio: { label: "Alumínio", unit: "kg", co2Factor: 9.107, hazardous: false, skills: ["alumínio", "conformação", "fundição"], kgPerUnit: 1 },
  plastico: { label: "Plásticos (PE, PP)", unit: "kg", co2Factor: 3.165, hazardous: false, skills: ["plásticos", "injeção", "embalagem"], kgPerUnit: 1 },
  madeira: { label: "Madeira e pallets", unit: "kg", co2Factor: 0.27, hazardous: false, skills: ["embalagem", "logística"], kgPerUnit: 1 },
  papelao: { label: "Papel e papelão", unit: "kg", co2Factor: 1.194, hazardous: false, skills: ["embalagem", "logística"], kgPerUnit: 1 },
  textil: { label: "Têxteis", unit: "kg", co2Factor: 22.31, hazardous: false, skills: ["têxtil", "corte", "modelagem"], kgPerUnit: 1 },
  fluido: { label: "Óleos e fluidos industriais", unit: "L", co2Factor: 1.261, hazardous: true, skills: ["fluidos", "química", "efluentes"], kgPerUnit: 0.9 },
  tinta: { label: "Tintas e revestimentos", unit: "kg", co2Factor: 3.5, hazardous: true, skills: ["pintura", "processos", "resíduos"], kgPerUnit: 1 },
  organico: { label: "Orgânicos e alimentos", unit: "kg", co2Factor: 3.701, hazardous: false, skills: ["alimentos", "biogás", "compostagem"], kgPerUnit: 1 },
} as const satisfies Record<string, Category>;

export type CategoryKey = keyof typeof CATEGORIES;
export const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[];

export function category(key: string): Category {
  return (CATEGORIES as Record<string, Category>)[key] ?? CATEGORIES.aco;
}

export interface Destination {
  label: string;
  /** a massa volta para a economia */
  circular: boolean;
  /** crédito de emissões: substituição de material virgem, reuso direto ou nenhum */
  credit: "none" | "substitution" | "reuse";
  /** emissões de destinação (DEFRA 2024, Waste disposal) */
  disposal: "landfill" | "combustion" | null;
}

export const DESTINATIONS = {
  aterro: { label: "Aterro (Classe II)", circular: false, credit: "none", disposal: "landfill" },
  classe1: { label: "Coleta Classe I", circular: false, credit: "none", disposal: "combustion" },
  incineracao: { label: "Incineração", circular: false, credit: "none", disposal: "combustion" },
  sucata: { label: "Venda como sucata", circular: true, credit: "substitution", disposal: null },
  reciclagem: { label: "Reciclagem", circular: true, credit: "substitution", disposal: null },
  simbiose: { label: "Simbiose industrial", circular: true, credit: "substitution", disposal: null },
  reuso: { label: "Reuso interno", circular: true, credit: "reuse", disposal: null },
} as const satisfies Record<string, Destination>;

export type DestinationKey = keyof typeof DESTINATIONS;
export const DESTINATION_KEYS = Object.keys(DESTINATIONS) as DestinationKey[];

export function destination(key: string): Destination {
  return (DESTINATIONS as Record<string, Destination>)[key] ?? DESTINATIONS.aterro;
}

/** Parâmetros de frete e transporte usados no matching. */
export const LOGISTICS = {
  /** R$ por tonelada por km (carga fracionada em caminhão leve) */
  freightPerTonKm: 0.9,
  /** kg CO2e por tonelada por km (caminhão a diesel) */
  co2PerTonKm: 0.09752, // DESNZ/DEFRA 2024, HGV all diesel, average laden
  /** raio máximo de busca de parceiros, em km */
  maxRadiusKm: 40,
};
