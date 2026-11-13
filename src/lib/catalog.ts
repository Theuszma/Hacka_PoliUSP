/**
 * Catálogo de domínio: categorias de material e destinos de resíduo.
 * Fatores de emissão (kg CO2e por unidade de material virgem) são aproximações de
 * literatura usadas para estimativa; em produção viriam de uma base auditada.
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
  aco: { label: "Aço e chapas metálicas", unit: "kg", co2Factor: 1.9, hazardous: false, skills: ["aço", "nesting", "conformação", "estamparia"], kgPerUnit: 1 },
  aluminio: { label: "Alumínio", unit: "kg", co2Factor: 8.6, hazardous: false, skills: ["alumínio", "conformação", "fundição"], kgPerUnit: 1 },
  plastico: { label: "Plásticos (PE, PP)", unit: "kg", co2Factor: 2.0, hazardous: false, skills: ["plásticos", "injeção", "embalagem"], kgPerUnit: 1 },
  madeira: { label: "Madeira e pallets", unit: "kg", co2Factor: 0.45, hazardous: false, skills: ["embalagem", "logística"], kgPerUnit: 1 },
  papelao: { label: "Papel e papelão", unit: "kg", co2Factor: 0.9, hazardous: false, skills: ["embalagem", "logística"], kgPerUnit: 1 },
  textil: { label: "Têxteis", unit: "kg", co2Factor: 5.5, hazardous: false, skills: ["têxtil", "corte", "modelagem"], kgPerUnit: 1 },
  fluido: { label: "Óleos e fluidos industriais", unit: "L", co2Factor: 2.7, hazardous: true, skills: ["fluidos", "química", "efluentes"], kgPerUnit: 0.9 },
  tinta: { label: "Tintas e revestimentos", unit: "kg", co2Factor: 3.5, hazardous: true, skills: ["pintura", "processos", "resíduos"], kgPerUnit: 1 },
  organico: { label: "Orgânicos e alimentos", unit: "kg", co2Factor: 1.2, hazardous: false, skills: ["alimentos", "biogás", "compostagem"], kgPerUnit: 1 },
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
  /** fração das emissões incorporadas que se considera evitada */
  avoidedShare: number;
}

export const DESTINATIONS = {
  aterro: { label: "Aterro (Classe II)", circular: false, avoidedShare: 0 },
  classe1: { label: "Coleta Classe I", circular: false, avoidedShare: 0 },
  incineracao: { label: "Incineração", circular: false, avoidedShare: 0 },
  sucata: { label: "Venda como sucata", circular: true, avoidedShare: 0.5 },
  reciclagem: { label: "Reciclagem", circular: true, avoidedShare: 0.6 },
  simbiose: { label: "Simbiose industrial", circular: true, avoidedShare: 0 },
  reuso: { label: "Reuso interno", circular: true, avoidedShare: 0.9 },
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
  co2PerTonKm: 0.1,
  /** raio máximo de busca de parceiros, em km */
  maxRadiusKm: 40,
};
