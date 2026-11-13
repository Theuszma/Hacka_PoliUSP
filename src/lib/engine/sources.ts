/**
 * Referências usadas pelo motor de cálculo. Cada número exibido na plataforma aponta
 * para uma destas fontes (ou para uma premissa declarada em METHODS).
 */
export interface Source {
  id: string;
  short: string;
  citation: string;
  url?: string;
  /** "verificada": número ou método conferido na fonte */
  status: "verificada" | "pendente";
}

export const SOURCES = {
  emfMci: {
    id: "emfMci",
    short: "Ellen MacArthur Foundation (2015/2019)",
    citation: "Ellen MacArthur Foundation; Granta Design. Circularity Indicators: An Approach to Measuring Circularity — Methodology. 2015, revisado em 2019.",
    url: "https://www.ellenmacarthurfoundation.org/material-circularity-indicator",
    status: "verificada",
  },
  iglewicz: {
    id: "iglewicz",
    short: "Iglewicz e Hoaglin (1993)",
    citation: "IGLEWICZ, B.; HOAGLIN, D. C. How to Detect and Handle Outliers. Milwaukee: ASQC Quality Press, 1993. (ASQC Basic References in Quality Control, v. 16)",
    status: "verificada",
  },
  sen: {
    id: "sen",
    short: "Sen (1968)",
    citation: "SEN, P. K. Estimates of the regression coefficient based on Kendall's tau. Journal of the American Statistical Association, v. 63, n. 324, p. 1379–1389, 1968.",
    url: "https://doi.org/10.1080/01621459.1968.10480934",
    status: "verificada",
  },
  chertow: {
    id: "chertow",
    short: "Chertow (2000)",
    citation: "CHERTOW, M. R. Industrial symbiosis: literature and taxonomy. Annual Review of Energy and the Environment, v. 25, p. 313–337, 2000.",
    url: "https://doi.org/10.1146/annurev.energy.25.1.313",
    status: "verificada",
  },
  nbr10004: {
    id: "nbr10004",
    short: "ABNT NBR 10004",
    citation: "ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. NBR 10004: Resíduos sólidos — Classificação. Rio de Janeiro: ABNT, 2004.",
    status: "verificada",
  },
  iso14044: {
    id: "iso14044",
    short: "ISO 14044:2006",
    citation: "INTERNATIONAL ORGANIZATION FOR STANDARDIZATION. ISO 14044: Environmental management — Life cycle assessment — Requirements and guidelines. Genebra: ISO, 2006. Seção 4.3.4 (alocação e expansão do sistema).",
    status: "verificada",
  },
  pnrs: {
    id: "pnrs",
    short: "Lei 12.305/2010 (PNRS)",
    citation: "BRASIL. Lei nº 12.305, de 2 de agosto de 2010. Institui a Política Nacional de Resíduos Sólidos. Art. 9º (ordem de prioridade: não geração, redução, reutilização, reciclagem, tratamento e disposição final).",
    url: "https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2010/lei/l12305.htm",
    status: "verificada",
  },
  defra2024: {
    id: "defra2024",
    short: "DESNZ/DEFRA (2024)",
    citation: "UK DEPARTMENT FOR ENERGY SECURITY AND NET ZERO. Greenhouse gas reporting: conversion factors 2024 (Material use, Waste disposal, Freighting goods). Londres, 2024.",
    url: "https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024",
    status: "verificada",
  },
} as const satisfies Record<string, Source>;

export type SourceId = keyof typeof SOURCES;
