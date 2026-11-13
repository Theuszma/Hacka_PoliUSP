/**
 * Material Circularity Indicator (MCI), adaptado ao escopo da fábrica.
 *
 * Fonte: Ellen MacArthur Foundation & Granta Design (2015, rev. 2019).
 * Circularity Indicators: An Approach to Measuring Circularity — Methodology.
 *
 *   LFI = (V + W) / (2M + (Wf − Wc) / 2)
 *   MCI = max(0, 1 − LFI · F(X)),  F(X) = 0,9 / X
 *
 * Adaptação (portão a portão): a PME não controla o fim de vida do produto que vende,
 * então consideramos só o que acontece dentro da fábrica:
 *   M  = massa de insumo comprada no mês
 *   V  = parte dessa massa que é virgem (M menos o que veio de resíduo de outra empresa)
 *   W  = resíduo de processo que não é recuperado (aterro, incineração, Classe I)
 *   Wf = Wc = 0 (sem etapa de reciclagem própria) e utilidade X = 1 (vida útil média do setor)
 * Assim o MCI vai de 0,55 (tudo virgem, nada perdido) a 1 (insumo 100% reaproveitado e
 * nenhum resíduo perdido); cada kg perdido para aterro ou cada kg virgem substituído por
 * resíduo de um parceiro move o indicador.
 */

export interface MciInput {
  /** massa comprada (kg/mês) */
  mass: number;
  /** massa de origem reciclada ou de simbiose (kg/mês) */
  recycledFeed: number;
  /** resíduo não recuperado (kg/mês) */
  unrecoveredWaste: number;
}

export interface MciResult {
  mci: number;
  lfi: number;
  virgin: number;
  unrecovered: number;
  mass: number;
}

export const UTILITY_X = 1;

export function mci(inputs: MciInput[]): MciResult {
  const mass = sum(inputs.map((i) => i.mass));
  if (mass <= 0) return { mci: 0, lfi: 1, virgin: 0, unrecovered: 0, mass: 0 };
  const recycled = sum(inputs.map((i) => Math.min(i.recycledFeed, i.mass)));
  const virgin = mass - recycled;
  const unrecovered = sum(inputs.map((i) => i.unrecoveredWaste));
  const lfi = Math.min(1, (virgin + unrecovered) / (2 * mass));
  const fx = 0.9 / UTILITY_X;
  return { mci: Math.max(0, 1 - lfi * fx), lfi, virgin, unrecovered, mass };
}

function sum(xs: number[]) {
  return xs.reduce((s, v) => s + v, 0);
}
