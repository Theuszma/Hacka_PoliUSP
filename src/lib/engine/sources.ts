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
  cullenAllwood2013: {
    id: "cullenAllwood2013",
    short: "Cullen e Allwood (2013)",
    citation: "CULLEN, J. M.; ALLWOOD, J. M. Mapping the global flow of aluminum: from liquid aluminum to end-use goods. Environmental Science & Technology, v. 47, n. 7, p. 3057–3064, 2013.",
    url: "https://doi.org/10.1021/es304256s",
    status: "verificada",
  },
  flint2019: {
    id: "flint2019",
    short: "Flint, Allwood e Cabrera Serrenho (2019)",
    citation: "FLINT, I. P.; ALLWOOD, J. M.; CABRERA SERRENHO, A. Scrap, carbon and cost savings from the adoption of flexible nested blanking. The International Journal of Advanced Manufacturing Technology, v. 104, p. 1171–1181, 2019.",
    url: "https://doi.org/10.1007/s00170-019-03995-6",
    status: "verificada",
  },
  ingarao2015: {
    id: "ingarao2015",
    short: "Ingarao et al. (2015)",
    citation: "INGARAO, G. et al. Subtractive versus mass conserving metal shaping technologies: an environmental impact comparison. Journal of Cleaner Production, v. 87, p. 862–873, 2015.",
    url: "https://doi.org/10.1016/j.jclepro.2014.10.018",
    status: "verificada",
  },
  biller2026: {
    id: "biller2026",
    short: "Biller (2026)",
    citation: "BILLER, K. How sustainable are powder coatings? Products Finishing, 27 mar. 2026.",
    url: "https://www.pfonline.com/articles/how-sustainable-are-powder-coatings",
    status: "verificada",
  },
  mohar2016: {
    id: "mohar2016",
    short: "Mohar (2016)",
    citation: "MOHAR, F. How to boost first-pass transfer efficiency in powder coating. The Fabricator, 4 jan. 2016.",
    url: "https://www.thefabricator.com/thefabricator/article/finishing/how-to-boost-first-pass-transfer-efficiency-in-powder-coating",
    status: "verificada",
  },
  mannheim2026: {
    id: "mannheim2026",
    short: "Mannheim, Szabó e Lovasné Avató (2026)",
    citation: "MANNHEIM, V.; SZABÓ, K.; LOVASNÉ AVATÓ, J. Energy efficiency and decarbonisation pathways in injection moulding: a life cycle assessment of end-of-life allocation methods. Energies, v. 19, n. 10, 2295, 2026.",
    url: "https://doi.org/10.3390/en19102295",
    status: "verificada",
  },
  rissanen2013: {
    id: "rissanen2013",
    short: "Rissanen (2013)",
    citation: "RISSANEN, T. Zero-waste fashion design: a study at the intersection of cloth, fashion design and pattern cutting. Tese (Doutorado) — University of Technology Sydney, 2013.",
    url: "https://opus.lib.uts.edu.au/handle/10453/23384",
    status: "verificada",
  },
  gorynska2021: {
    id: "gorynska2021",
    short: "Goryńska-Goldmann et al. (2021)",
    citation: "GORYŃSKA-GOLDMANN, E. et al. How to prevent bread losses in the baking and confectionery industry? Measurement, causes, management and prevention. Agriculture, v. 11, n. 1, 19, 2021.",
    url: "https://doi.org/10.3390/agriculture11010019",
    status: "verificada",
  },
  fao2011: {
    id: "fao2011",
    short: "FAO (2011)",
    citation: "FAO. Global food losses and food waste: extent, causes and prevention. Roma: FAO, 2011. Anexo 4 (América Latina).",
    url: "https://www.fao.org/docrep/014/mb060e/mb060e00.htm",
    status: "verificada",
  },
  henz2017: {
    id: "henz2017",
    short: "Henz e Porpino (2017)",
    citation: "HENZ, G. P.; PORPINO, G. Food losses and waste: how Brazil is facing this global challenge? Horticultura Brasileira, v. 35, p. 472–482, 2017.",
    url: "https://doi.org/10.1590/S0102-053620170402",
    status: "verificada",
  },
  hillig2009: {
    id: "hillig2009",
    short: "Hillig, Schneider e Pavoni (2009)",
    citation: "HILLIG, É.; SCHNEIDER, V. E.; PAVONI, E. T. Geração de resíduos de madeira e derivados da indústria moveleira em função das variáveis de produção. Produção, v. 19, n. 2, p. 292–303, 2009.",
    url: "https://doi.org/10.1590/S0103-65132009000200006",
    status: "verificada",
  },
  nescaum: {
    id: "nescaum",
    short: "NESCAUM (s.d.)",
    citation: "NESCAUM. Wood furniture: the Clean Air Act Amendments of 1990 and pollution prevention opportunities. Boston: NESCAUM, [1996?].",
    url: "https://www.nescaum.org/documents/woodfurnexsum.pdf",
    status: "verificada",
  },
} as const satisfies Record<string, Source>;

export type SourceId = keyof typeof SOURCES;
