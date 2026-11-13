# Elo · Rede de indústria circular

Projeto do **Hack@Poli 2026** — tema "Engenharia com propósito: o papel do engenheiro na Agenda 2030", eixo **Inovação e Digitalização da Indústria Nacional (ODS 9 e 12)**.

## O problema

Pequenas e médias indústrias perdem parte grande do que compram como resíduo (retalho de chapa, fluido de corte, overspray de tinta, embalagens) e raramente sabem quanto isso custa em reais e em CO₂. Elas também não têm engenheiro dedicado a processo ou meio ambiente. Ao mesmo tempo, estudantes de engenharia precisam de projetos reais e de horas de extensão, e engenheiros experientes querem mentorar.

## A solução

O **Elo** é uma plataforma web com dois lados:

**Indústria (PME)**
1. **Onboarding guiado**: dados da empresa, insumos sugeridos pelo setor e materiais que aceita receber.
2. **Insumos e resíduos**: cadastro, edição e importação de planilha CSV; cada alteração entra no histórico mensal.
3. **Visão geral**: prejuízo mensal, taxa de desperdício, CO₂e e circularidade, com variação mês a mês, tendência de 12 meses, comparação com a perda média do setor e oportunidades priorizadas.
4. **Simulador**: cenários "e se" combinando melhorias de processo e trocas de resíduo, com economia anual e CO₂e evitado.
5. **Marketplace de resíduos**: o motor de matching cruza os resíduos de todas as empresas com o que as outras aceitam como insumo, por material, volume, capacidade, licença ambiental e distância (com frete descontado). Dá para propor, aceitar e recusar trocas.
6. **Engenheiros**: recomendação de estudantes e mentores por especialidade, ponderada pelo prejuízo de cada insumo. O pedido de apoio já sai com um briefing gerado a partir do diagnóstico.

**Engenheiro ou estudante**
1. **Demandas abertas** ordenadas pela aderência às suas áreas e pelo impacto.
2. **Demanda**: briefing, linha do tempo com mensagens, assumir, concluir registrando resultado e economia validada.
3. **Perfil**: horas de extensão e economia gerada para as empresas.

**Notificações** avisam propostas, respostas, convites e mensagens.

**Impacto da rede** (página pública e interna): resíduo desviado do aterro, valor gerado, CO₂e evitado, horas de engenharia e o potencial ainda não aproveitado, tudo calculado a partir do banco.

## Como rodar

Requisitos: **Node.js 20 ou mais novo** e **Docker Desktop** (para o PostgreSQL).

```bash
cp .env.example .env   # no Windows: copy .env.example .env
npm run setup     # instala dependências, sobe o Postgres no Docker, aplica as migrations e carrega os dados
npm run dev       # http://localhost:3000
```

Quer rodar tudo dentro do Docker, sem Node na máquina? `docker compose up --build` sobe o banco e o app em http://localhost:3000 e carrega os dados na primeira vez.

**Dados de demonstração.** São fictícios, mas contam uma história coerente de 12 meses numa rede do ABC Paulista: 20 empresas e 16 engenheiros. As trocas aceitas mudam o destino do resíduo a partir do mês em que começaram. As demandas concluídas reduzem a perda a partir do mês da entrega. Mensagens e notificações batem com esses eventos. Gráficos, histórico, marketplace e relatórios mostram o mesmo roteiro.

**Contas**

- Crie uma conta em `/cadastro` (indústria ou engenheiro) e siga o onboarding guiado: a indústria escolhe o setor, recebe os insumos típicos com a perda de referência e sai com o diagnóstico pronto.
- Ou use as contas de demonstração (botões em `/entrar` e "Ver demonstração" na página inicial). Senha de todas: `elo2026`.
  - Indústria: `rosana@ipiranga.demo` (Metalúrgica Ipiranga)
  - Engenheira: `ana@poli.demo` (Ana Ribeiro, estudante)
  - Mentor: `carlos@mentor.demo` (Carlos Menezes, revisa as entregas dos estudantes)

**Mentoria.** Quando um(a) estudante conclui uma demanda, a entrega fica "Em revisão". Um(a) mentor(a) sênior confere o resultado, pode ajustar a economia e valida, ou então pede ajustes. A empresa só vê a economia como validada, com o selo do(a) mentor(a), depois dessa revisão. Mentores que executam uma demanda validam o próprio trabalho.

Para voltar o banco ao estado inicial: `npm run db:reset`. Se o Next mostrar erro de campo desconhecido do Prisma depois de atualizar o código, rode `npm run clean` e reinicie o `npm run dev`.

Outros comandos:

| Comando | O que faz |
|---|---|
| `npm test` | testes unitários do núcleo de cálculo e matching (Vitest) |
| `npm run lint` | checagem de tipos do TypeScript |
| `npm run test:e2e` | testes de ponta a ponta no navegador (Playwright) |
| `npm run build && npm start` | build de produção |
| `npm run db:up` | só sobe o Postgres no Docker |

## Stack

| Camada | Escolha |
|---|---|
| Aplicação | Next.js 15 (App Router, Server Components e Server Actions) + React 19 + TypeScript |
| Banco | PostgreSQL 16 (Docker Compose) + Prisma ORM com migrations |
| Validação | Zod nas Server Actions |
| Autenticação | Contas próprias: senha com scrypt, sessão em cookie httpOnly |
| Interface | Tailwind CSS com design system próprio (tokens, modo claro e escuro), Radix UI, Lucide, Recharts, Sonner |
| Planilhas | PapaParse (importação CSV no navegador) |
| Testes | Vitest |

## Arquitetura

```
src/
  app/                 rotas (App Router)
    actions.ts         todas as mutações (Server Actions, validadas com Zod)
    page.tsx           página inicial do produto
    (auth)/            entrar e cadastro
    onboarding/        configuração guiada da empresa e do engenheiro
    app/               área da indústria: visão geral, insumos, simulador, marketplace, engenheiros, demandas, configurações
    eng/               área do engenheiro: demandas abertas, minhas demandas, perfil e horas
    demandas/[id]/     detalhe compartilhado da demanda
    impacto/           indicadores da rede
  lib/
    catalog.ts         categorias de material, destinos, fatores de emissão, parâmetros de frete
    metrics.ts         indicadores de desperdício e circularidade (funções puras)
    matching.ts        motores de simbiose e de engenheiro × problema (funções puras)
    briefing.ts        geração do briefing do pedido de apoio
    data.ts            consultas ao banco usadas por várias páginas
    auth.ts            sessões (cookie httpOnly + tabela Session), senhas com scrypt
    sectors.ts         setores, insumos típicos e perdas de referência (benchmark)
    network.ts         indicadores agregados da rede
  components/
    ui/                design system (botões, formulários, cards, tabelas, diálogos, menus, abas)
    ...                shell, gráficos (Recharts), mapa da rede, onboarding, simulador
prisma/
  schema.prisma        modelo de dados
  seed.ts              rede piloto fictícia no ABC Paulista
prototipo-v1/          primeira versão estática (HTML único)
```

O núcleo de regras (`metrics.ts` e `matching.ts`) não depende de banco nem de framework, por isso roda no servidor (painéis) e no navegador (simulador) e é coberto por testes.

### Modelo de dados

- **User**, **Session**, **Notification**: contas, sessões e avisos.
- **Company**: PME com setor, porte e localização (lat/lng).
- **MonthlyRecord**: fotografia mensal de cada insumo (histórico e tendência).
- **MaterialFlow**: insumo e sua perda mensal, destino do resíduo, fornecedor e lote.
- **InputDemand**: o que uma empresa aceita receber como insumo, a que preço, quanto e se tem licença para resíduo perigoso.
- **Exchange**: proposta de troca entre duas empresas (proposta → aceita/recusada).
- **Engineer**: perfil técnico (estudante ou mentor), áreas, disponibilidade.
- **SupportRequest** e **RequestUpdate**: pedido de apoio técnico e sua linha do tempo.

### Motor de cálculo

Fica em `src/lib/engine/` e em `src/lib/metrics.ts`. São funções puras e testadas, recalculadas a cada mudança de insumo, troca ou demanda. Cada número tem um ícone "como calculamos" com a fórmula, as premissas e a fonte. A página `/metodologia` reúne tudo.

| Indicador | Fórmula | Fonte |
|---|---|---|
| Prejuízo | resíduo × custo unitário − resíduo × valor do destino | — |
| CO₂e incorporado | resíduo (kg) × fator de produção primária do material | DESNZ/DEFRA 2024, aba *Material use* |
| Emissões de destinação | resíduo (kg) × fator de aterro ou combustão | DESNZ/DEFRA 2024, aba *Waste disposal* |
| CO₂e evitado | resíduo (kg) × (fator primário − fator reciclado) × substituição + aterro evitado | ISO 14044 (substituição) + DEFRA 2024 |
| Frete | 0,09752 kg CO₂e por t·km | DEFRA 2024, HGV diesel, carga média |
| Circularidade (MCI) | LFI = (V + W) ÷ 2M · MCI = 1 − 0,9 × LFI (adaptado portão a portão) | Ellen MacArthur Foundation (2015/2019) |
| Desvio de aterro | massa com destino circular ÷ massa de resíduo | PNRS (Lei 12.305/2010), NBR 10004 |
| Mês fora do padrão | escore-z modificado 0,6745·(x − mediana)/MAD, alerta se ≥ 3,5 | Iglewicz e Hoaglin (1993) |
| Tendência | inclinação de Theil-Sen | Sen (1968) |
| Troca de resíduo | (preço pago − valor do destino) × volume − frete | simbiose industrial, Chertow (2000) |

Os fatores foram tirados da planilha oficial *Greenhouse gas reporting: conversion factors 2024* (conjunto condensado v1.1), que está em `docs/fontes/`. Aço usa a linha *Metal: steel cans* e têxtil usa *Clothing*, os equivalentes mais próximos da tabela. Tintas não têm linha na tabela, então o fator é uma estimativa e aparece marcado assim. As perdas de referência por setor (`src/lib/sectors.ts`) também são estimativas e ainda precisam ser validadas com dados do setor.

### Próximos passos para produção

- Login social e convite de colegas para a mesma empresa.
- Postgres com PostGIS para busca geográfica.
- Importar insumos das notas fiscais de compra (XML da NF-e) e destinos do Manifesto de Transporte de Resíduos (MTR/SINIR).
- Fatores brasileiros quando houver base pública por material (ex.: SICV Brasil) e benchmarks setoriais validados.
- Relatório de horas de extensão para a Pró-Reitoria e revisão dos trabalhos de estudantes por mentores.

## Dados

Todas as empresas, pessoas e números são **fictícios**, criados para demonstrar o funcionamento.
