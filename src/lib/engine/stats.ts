/**
 * Estatística robusta para séries mensais curtas (12 pontos).
 *
 * - Escore-z modificado (mediana e MAD), com limite de 3,5 para outlier:
 *   Iglewicz, B.; Hoaglin, D. C. (1993). How to Detect and Handle Outliers. ASQC Quality Press.
 * - Tendência pelo estimador de Theil-Sen (mediana das inclinações entre pares):
 *   Sen, P. K. (1968). Estimates of the regression coefficient based on Kendall's tau.
 *   Journal of the American Statistical Association, 63(324), 1379–1389.
 */

export function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Desvio absoluto mediano. */
export function mad(xs: number[]): number {
  const m = median(xs);
  return median(xs.map((x) => Math.abs(x - m)));
}

/** Escore-z modificado de `x` em relação à amostra (0,6745 · (x − mediana) / MAD). */
export function modifiedZ(x: number, sample: number[]): number {
  const m = median(sample);
  const d = mad(sample);
  if (d > 0) return (0.6745 * (x - m)) / d;
  // MAD nulo (série quase constante): usa o desvio absoluto médio, como sugerem Iglewicz e Hoaglin
  const meanAd = sample.reduce((s, v) => s + Math.abs(v - m), 0) / (sample.length || 1);
  if (meanAd > 0) return (x - m) / (1.253314 * meanAd);
  return x === m ? 0 : Math.sign(x - m) * Infinity;
}

export const OUTLIER_Z = 3.5;

/** Inclinação de Theil-Sen por período. */
export function theilSen(ys: number[]): number {
  const slopes: number[] = [];
  for (let i = 0; i < ys.length; i++) for (let j = i + 1; j < ys.length; j++) slopes.push((ys[j] - ys[i]) / (j - i));
  return median(slopes);
}

export interface Anomaly {
  /** valor do último mês */
  value: number;
  /** mediana dos meses anteriores */
  baseline: number;
  z: number;
  direction: "up" | "down";
}

/**
 * Último ponto da série é atípico em relação aos anteriores?
 * Exige ao menos 6 meses de histórico para não alarmar à toa.
 */
export function lastPointAnomaly(series: number[], threshold = OUTLIER_Z): Anomaly | null {
  if (series.length < 7) return null;
  const history = series.slice(0, -1);
  const value = series[series.length - 1];
  const z = modifiedZ(value, history);
  if (!Number.isFinite(z) && value === median(history)) return null;
  if (Math.abs(z) < threshold) return null;
  return { value, baseline: median(history), z, direction: z > 0 ? "up" : "down" };
}

export interface Trend {
  /** variação por mês (mesma unidade da série) */
  slope: number;
  /** variação acumulada no período, relativa ao nível inicial estimado */
  relative: number;
  direction: "up" | "down" | "flat";
}

/** Tendência de uma série; "flat" se a variação acumulada ficar abaixo de `minRelative`. */
export function trendOf(series: number[], minRelative = 0.1): Trend | null {
  if (series.length < 4) return null;
  const slope = theilSen(series);
  const start = median(series.slice(0, 3));
  const relative = start ? (slope * (series.length - 1)) / start : 0;
  const direction = Math.abs(relative) < minRelative ? "flat" : relative > 0 ? "up" : "down";
  return { slope, relative, direction };
}
