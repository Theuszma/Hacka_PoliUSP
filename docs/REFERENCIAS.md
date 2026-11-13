# Referências do Elo

De onde vêm os números e as fórmulas da plataforma. As mesmas referências aparecem na página **Como calculamos** (`/metodologia`) e no ícone (i) ao lado de cada indicador.

O cadastro de empresas, pessoas, insumos, trocas e demandas usado na demonstração é **fictício** (`prisma/seed.ts`). As fontes abaixo dizem respeito aos **fatores e métodos** aplicados sobre esses dados.

## Fontes e o que cada uma alimenta

| # | Referência (ABNT) | O que alimenta | Onde está no código |
|---|---|---|---|
| 1 | UNITED KINGDOM. Department for Energy Security and Net Zero. **Greenhouse gas reporting: conversion factors 2024**: condensed set, v1.1. Londres: DESNZ, 2024. Disponível em: https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024. Acesso em: 13 nov. 2026. | Fatores de CO₂e por material (aba *Material use*: produção primária e fonte reciclada), emissões de aterro e combustão (aba *Waste disposal*) e frete rodoviário (aba *Freighting goods*: HGV diesel, carga média, 0,09752 kg CO₂e/t·km). A planilha original está em `docs/fontes/`. | `src/lib/engine/factors.ts`, `src/lib/catalog.ts` |
| 2 | INTERNATIONAL ORGANIZATION FOR STANDARDIZATION. **ISO 14044**: environmental management: life cycle assessment: requirements and guidelines. Genebra: ISO, 2006. | Método de substituição (expansão do sistema, seção 4.3.4): o CO₂e evitado por reciclagem, sucata e simbiose é a diferença entre produzir o material primário e o reciclado. | `avoidedPerKg` em `src/lib/engine/factors.ts`, `src/lib/metrics.ts` |
| 3 | ELLEN MACARTHUR FOUNDATION; GRANTA DESIGN. **Circularity indicators**: an approach to measuring circularity: methodology. Cowes: Ellen MacArthur Foundation, 2015 (rev. 2019). Disponível em: https://www.ellenmacarthurfoundation.org/material-circularity-indicator. Acesso em: 13 nov. 2026. | Indicador de Circularidade de Material (MCI): LFI = (V + W) ÷ 2M e MCI = 1 − 0,9 × LFI, adaptado ao escopo da fábrica (portão a portão). | `src/lib/engine/mci.ts` |
| 4 | IGLEWICZ, B.; HOAGLIN, D. C. **How to detect and handle outliers**. Milwaukee: ASQC Quality Press, 1993. (ASQC Basic References in Quality Control, v. 16). | Alerta de mês fora do padrão: escore-z modificado 0,6745 × (x − mediana) ÷ MAD, com limite de 3,5. | `src/lib/engine/stats.ts` |
| 5 | SEN, P. K. Estimates of the regression coefficient based on Kendall's tau. **Journal of the American Statistical Association**, v. 63, n. 324, p. 1379-1389, 1968. DOI: 10.1080/01621459.1968.10480934. | Tendência da perda: estimador de Theil-Sen (mediana das inclinações). | `src/lib/engine/stats.ts` |
| 6 | CHERTOW, M. R. Industrial symbiosis: literature and taxonomy. **Annual Review of Energy and the Environment**, v. 25, p. 313-337, 2000. DOI: 10.1146/annurev.energy.25.1.313. | Conceito de simbiose industrial que orienta o marketplace: resíduo de uma empresa como insumo de outra próxima. | `src/lib/matching.ts` |
| 7 | BRASIL. **Lei nº 12.305, de 2 de agosto de 2010**. Institui a Política Nacional de Resíduos Sólidos. Brasília, DF: Presidência da República, 2010. Disponível em: https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2010/lei/l12305.htm. Acesso em: 13 nov. 2026. | Ordem de prioridade do art. 9º (não geração, redução, reutilização, reciclagem, tratamento e disposição final), usada para separar destinos circulares e não circulares. | `DESTINATIONS` em `src/lib/catalog.ts` |
| 8 | ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. **NBR 10004**: resíduos sólidos: classificação. Rio de Janeiro: ABNT, 2004. | Classe I (perigoso) e Classe II: só destinatários licenciados recebem resíduo perigoso no matching. | `hazardous` em `src/lib/catalog.ts`, `src/lib/matching.ts` |

## Escolhas e premissas sem fonte externa

São declaradas na tela, no "Como calculamos", e podem ser revistas.

| Premissa | Valor | Onde está |
|---|---|---|
| Linha da DEFRA usada para aço | *Metal: steel cans* (a mais próxima de chapa de aço na tabela) | `factors.ts` |
| Linha da DEFRA usada para têxteis | *Clothing* (a tabela não traz fio nem tecido; tende a superestimar) | `factors.ts` |
| Fator de produção de tintas | 3,5 kg CO₂e/kg, **estimativa** (não há linha na tabela) | `factors.ts` |
| Perda de referência por setor | **estimativas** para comparação; ainda precisam ser validadas com dados setoriais | `src/lib/sectors.ts` |
| Taxa de realização das melhorias de processo | 85% da redução esperada | `src/lib/engine/premises.ts` |
| Utilidade no MCI | X = 1 (vida útil média do setor) | `mci.ts` |
| Limite para considerar tendência | 10% de variação acumulada | `stats.ts` |
| Custo de frete | R$ 0,90 por t·km | `LOGISTICS` em `catalog.ts` |
