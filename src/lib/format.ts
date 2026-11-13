const brl0 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const brl2 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const money = (v: number) => brl0.format(Math.round(v));
export const money2 = (v: number) => brl2.format(v);
export const num = (v: number, digits = 0) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);
export const pct = (v: number, digits = 0) => `${num(v * 100, digits)}%`;
export const tons = (kg: number, digits = 1) => `${num(kg / 1000, digits)} t`;
export const signedMoney2 = (v: number) => (v > 0 ? "+" : v < 0 ? "−" : "") + brl2.format(Math.abs(v));

export function relativeDate(d: Date, now = new Date()): string {
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  const days = Math.floor(diff / 86400);
  if (days < 30) return `há ${days} dia${days > 1 ? "s" : ""}`;
  return d.toLocaleDateString("pt-BR");
}

/** Primeira letra minúscula, preservando siglas no resto (ex.: "Chapa SAE" → "chapa SAE"). */
export const lowerFirst = (s: string) => (s ? s[0].toLowerCase() + s.slice(1) : s);
