# Elo · Rede de indústria circular

Projeto do **Hack@Poli 2026** — tema "Engenharia com propósito: o papel do engenheiro na Agenda 2030", eixo **Inovação e Digitalização da Indústria Nacional (ODS 9 e 12)**.

## O problema

Pequenas e médias indústrias perdem parte grande do que compram como resíduo (retalho de chapa, fluido de corte, overspray de tinta, embalagens) e raramente sabem quanto isso custa em reais e em CO₂. Elas também não têm engenheiro dedicado a processo ou meio ambiente. Ao mesmo tempo, estudantes de engenharia precisam de projetos reais e de horas de extensão, e engenheiros experientes querem mentorar.

## A solução

O **Elo** é uma plataforma web com dois lados:

**Indústria (PME)**
1. **Insumos e resíduos**: cadastra cada material comprado, a perda, o destino do resíduo, fornecedor e lote.
2. **Painel**: prejuízo mensal com resíduos, taxa de desperdício, CO₂e no material perdido e índice de circularidade.
3. **Simulador**: cenários "e se" combinando melhorias de processo e trocas de resíduo, com economia anual e CO₂e evitado.
4. **Simbiose industrial**: o motor de matching cruza os resíduos de todas as empresas com o que as outras aceitam como insumo, por material, volume, capacidade, licença ambiental e distância (com frete descontado). Dá para propor, aceitar e recusar trocas.
5. **Engenheiros**: recomendação de estudantes e mentores por especialidade, ponderada pelo prejuízo de cada insumo. O pedido de apoio já sai com um briefing gerado a partir do diagnóstico.

**Engenheiro ou estudante**
1. **Demandas abertas** ordenadas pela aderência às suas áreas e pelo impacto.
2. **Demanda**: briefing, linha do tempo com mensagens, assumir, concluir registrando resultado e economia validada.
3. **Perfil**: horas de extensão e economia gerada para as empresas.

**Impacto da rede**: resíduo desviado do aterro, valor gerado, CO₂e evitado, horas de engenharia e o potencial ainda não aproveitado, tudo calculado a partir do banco.

## Como rodar

Requisitos: **Node.js 20 ou mais novo**.

```bash
npm run setup     # instala dependências, cria o banco SQLite e carrega os dados de exemplo
npm run dev       # http://localhost:3000
```

Na tela inicial, escolha **Entrar como indústria** (Metalúrgica Ipiranga) ou **Entrar como engenheira** (Ana Ribeiro). Para voltar o banco ao estado inicial: `npm run db:reset`.

Outros comandos:

| Comando | O que faz |
|---|---|
| `npm test` | testes unitários do núcleo de cálculo e matching (Vitest) |
| `npm run lint` | checagem de tipos do TypeScript |
| `npm run build && npm start` | build de produção |

## Stack

| Camada | Escolha |
|---|---|
| Aplicação | Next.js 15 (App Router, Server Components e Server Actions) + React 19 + TypeScript |
| Banco | Prisma ORM + SQLite local (troque o `provider` para `postgresql` em produção) |
| Validação | Zod nas Server Actions |
| Interface | Tailwind CSS com tokens próprios, modo claro e escuro |
| Testes | Vitest |

## Arquitetura

```
src/
  app/                 rotas (App Router)
    actions.ts         todas as mutações (Server Actions, validadas com Zod)
    entrar/            escolha de perfil
    empresa/           painel, insumos, simulador, simbiose, engenheiros, pedidos
    engenheiro/        demandas abertas, minhas demandas, perfil
    demandas/[id]/     detalhe compartilhado da demanda
    impacto/           indicadores da rede
  lib/
    catalog.ts         categorias de material, destinos, fatores de emissão, parâmetros de frete
    metrics.ts         indicadores de desperdício e circularidade (funções puras)
    matching.ts        motores de simbiose e de engenheiro × problema (funções puras)
    briefing.ts        geração do briefing do pedido de apoio
    data.ts            consultas ao banco usadas por várias páginas
    auth.ts            sessão da demonstração
  components/          UI (shell, gráficos, mapa da rede, formulários, simulador)
prisma/
  schema.prisma        modelo de dados
  seed.ts              rede piloto fictícia no ABC Paulista
prototipo-v1/          primeira versão estática (HTML único)
```

O núcleo de regras (`metrics.ts` e `matching.ts`) não depende de banco nem de framework, por isso roda no servidor (painéis) e no navegador (simulador) e é coberto por testes.

### Modelo de dados

- **Company**: PME com localização (lat/lng).
- **MaterialFlow**: insumo e sua perda mensal, destino do resíduo, fornecedor e lote.
- **InputDemand**: o que uma empresa aceita receber como insumo, a que preço, quanto e se tem licença para resíduo perigoso.
- **Exchange**: proposta de troca entre duas empresas (proposta → aceita/recusada).
- **Engineer**: perfil técnico (estudante ou mentor), áreas, disponibilidade.
- **SupportRequest** e **RequestUpdate**: pedido de apoio técnico e sua linha do tempo.

### Cálculos (por fluxo, por mês)

| Indicador | Fórmula |
|---|---|
| Resíduo | consumo × perda |
| Prejuízo | resíduo × custo unitário − resíduo × valor do destino (+ venda, − descarte) |
| CO₂e no desperdício | resíduo × fator de emissão do material |
| Circularidade | massa com destino circular ÷ massa total de resíduo |
| Ganho da troca (quem envia) | (preço pago pelo parceiro − valor do destino atual) × volume − frete |
| Economia da troca (quem recebe) | (preço do material novo − preço pago) × volume |
| CO₂e evitado na troca | volume × fator × taxa de substituição − emissões do transporte |

Fatores de emissão e parâmetros de frete estão em `src/lib/catalog.ts` e são aproximações para demonstração.

### Próximos passos para produção

- Autenticação real (Supabase Auth ou NextAuth) no lugar da escolha de perfil.
- Postgres com PostGIS para busca geográfica.
- Importar insumos das notas fiscais de compra (XML da NF-e) e destinos do Manifesto de Transporte de Resíduos (MTR/SINIR).
- Fatores de emissão de base auditada e relatório de horas de extensão para a Pró-Reitoria.

## Dados

Todas as empresas, pessoas e números são **fictícios**, criados para demonstrar o funcionamento.
