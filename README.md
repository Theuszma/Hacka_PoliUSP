# Elo · Rede de indústria circular

Protótipo para o **Hack@Poli 2026** — tema "Engenharia com propósito: o papel do engenheiro na Agenda 2030", eixo **Inovação e Digitalização da Indústria Nacional (ODS 9 e 12)**.

## O problema

Pequenas e médias indústrias perdem uma parte grande do que compram como resíduo (retalho de chapa, fluido de corte, overspray de tinta, embalagens) e raramente sabem quanto isso custa em reais e em CO₂. Elas também não têm engenheiro dedicado a processo ou meio ambiente. Ao mesmo tempo, estudantes de engenharia precisam de projetos reais (e de horas de extensão), e engenheiros experientes querem mentorar.

## A solução

O **Elo** é uma plataforma web onde a PME:

1. **Diagnostica** seus fluxos de material: consumo, perda, destino do resíduo, rastreio por fornecedor/lote. Recebe indicadores de prejuízo (R$), taxa de desperdício, CO₂e incorporado e índice de circularidade.
2. **Simula** cenários "e se": reduzir a perda de cada insumo com uma alavanca técnica, ou mandar o resíduo para um parceiro da rede.
3. **Encontra simbiose industrial**: o resíduo de uma empresa vira insumo de outra próxima (match por material, volume, capacidade e distância), nos dois sentidos.
4. **Conecta-se a engenheiros**: estudantes da Poli e mentores voluntários são recomendados por especialidade, ponderada pelo prejuízo de cada insumo. A PME publica uma demanda com briefing gerado automaticamente a partir do diagnóstico.
5. **Painel do engenheiro**: o estudante vê as demandas abertas das PMEs, assume uma e acumula horas de extensão.

É aqui que o edital é atendido: o engenheiro é a ponte entre o dado da fábrica e a ação.

## Como rodar

Abra `index.html` em qualquer navegador. Não precisa instalar nada nem ter internet (só as fontes vêm do Google Fonts; sem internet o navegador usa fontes do sistema).

O estado da demonstração fica no `localStorage` do navegador. Use **Reiniciar demonstração** no rodapé para voltar aos dados de exemplo.

## Estrutura

```
index.html   aplicação completa (HTML + CSS + JS puro, sem dependências)
src/elo.html fonte da página (sem o cabeçalho HTML; gera o index.html)
build.sh     monta o index.html a partir de src/elo.html
```

Dentro do script, o código está dividido em blocos:

- **Dados de exemplo**: empresa, fluxos de material, parceiros, ofertas, engenheiros e demandas.
- **Cálculos**: `flowMetrics()` (prejuízo, CO₂e, circularidade por fluxo e por cenário), `totals()`, `engineerScores()` (match engenheiro × problema).
- **Views**: uma função por aba (`viewDiagnostico`, `viewSimulador`, `viewSimbiose`, `viewEngenheiros`, `viewDemandas`, `viewImpacto`), roteadas pelo `#hash` da URL.

### Modelo de cálculo (por fluxo, por mês)

| Indicador | Fórmula |
|---|---|
| Resíduo gerado | consumo × perda |
| Material perdido (R$) | resíduo × custo unitário |
| Saldo do destino (R$) | resíduo × valor do destino (+ venda, − custo de descarte) |
| Prejuízo | material perdido − saldo do destino |
| CO₂e no desperdício | resíduo × fator de emissão do material |
| CO₂e evitado (simbiose) | resíduo × fator × taxa de substituição de matéria-prima virgem no parceiro |
| Circularidade | massa de resíduo com destino circular ÷ massa total de resíduo |

Fatores de emissão usados (kg CO₂e por kg ou L) são aproximações de literatura para demonstração: aço 1,9 · alumínio 8,6 · plástico 2,0 · madeira 0,45 · papelão 0,9 · têxtil 5,5 · fluido 2,7 · tinta 3,5.

## Arquitetura da versão de produção

```
 PME (web/mobile)      Engenheiro/estudante (web)
        │                        │
        └──────── Next.js (React) ┘
                     │
              API (Supabase / Postgres + Auth + RLS)
                     │
   ┌─────────────────┼──────────────────────┐
 Motor de matching   Motor de indicadores    Integrações
 (resíduo↔insumo,    (CO₂e, circularidade;   (NF-e para importar
  engenheiro↔demanda) fatores GHG Protocol)   insumos; CETESB/MTR)
```

- **Front-end**: Next.js + React.
- **Back-end e banco**: Supabase (Postgres, autenticação, regras por perfil PME / engenheiro / universidade).
- **Matching**: classificação de resíduos por código IBAMA/CONAMA, busca geográfica (PostGIS) por distância, ordenação por ganho líquido menos frete.
- **Entrada de dados sem atrito**: importar as notas fiscais de compra (XML da NF-e) para preencher os insumos e o Manifesto de Transporte de Resíduos (MTR/SINIR) para os destinos.
- **Universidade**: relatório de horas de extensão por estudante, com validação do mentor.

## Dados

Todas as empresas, pessoas e números da demonstração são **fictícios**, criados para ilustrar o funcionamento.
