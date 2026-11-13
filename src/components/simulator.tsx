"use client";

import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { money, money2, num, pct, tons } from "@/lib/format";
import { flowMetrics, totals, type FlowInput, type FlowScenario } from "@/lib/metrics";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardHeader } from "./ui/card";
import { cn } from "./ui/cn";

export interface SimFlow extends FlowInput {
  leverText: string | null;
  leverReduction: number | null;
  partner: { name: string; distanceKm: number; netUnitValue: number; substitution: number; volume: number } | null;
}

interface S { reduction: number; partner: boolean }

export function Simulator({ flows }: { flows: SimFlow[] }) {
  const [state, setState] = useState<Record<string, S>>({});
  const get = (id: string): S => ({ ...{ reduction: 0, partner: false }, ...state[id] });
  const set = (id: string, patch: Partial<S>) => setState((s) => ({ ...s, [id]: { ...{ reduction: 0, partner: false }, ...s[id], ...patch } }));

  const scenarios = useMemo(() => {
    const out: Record<string, FlowScenario> = {};
    for (const f of flows) {
      const s = get(f.id);
      out[f.id] = { reduction: s.reduction, alternative: s.partner && f.partner ? { destinationValue: f.partner.netUnitValue, substitution: f.partner.substitution } : null };
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, flows]);

  const base = totals(flows);
  const sim = totals(flows, scenarios);
  const saving = base.loss - sim.loss;
  const co2 = (base.netCo2 - sim.netCo2);
  const changed = Object.values(state).some((s) => s.reduction > 0 || s.partner);

  const applyAll = () => setState(Object.fromEntries(flows.map((f) => [f.id, { reduction: f.leverReduction ?? 0, partner: !!f.partner && f.partner.netUnitValue > f.destinationValue }])));

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] text-muted-foreground">Ajuste a redução de perda de cada insumo e ligue as trocas de resíduo sugeridas.</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={applyAll}>Aplicar recomendações</Button>
            <Button variant="ghost" size="sm" onClick={() => setState({})} disabled={!changed}><RotateCcw />Zerar</Button>
          </div>
        </div>
        {flows.map((f) => {
          const s = get(f.id);
          const before = flowMetrics(f);
          const after = flowMetrics(f, scenarios[f.id]);
          const gain = before.loss - after.loss;
          return (
            <Card key={f.id} className={cn("p-4 transition", (s.reduction > 0 || s.partner) && "border-foreground/25")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">perda atual de {pct(f.lossRate, 1)} · {money(before.loss)}/mês</p>
                </div>
                <p className={cn("tabular text-[13.5px] font-semibold", gain > 0.5 ? "text-success" : "text-muted-foreground")}>{gain > 0.5 ? `−${money(gain)}/mês` : "sem mudança"}</p>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="flex items-center justify-between text-xs text-muted-foreground" htmlFor={`r-${f.id}`}>
                    <span>Reduzir a perda em</span><span className="tabular font-medium text-foreground">{pct(s.reduction)}</span>
                  </label>
                  <input id={`r-${f.id}`} type="range" min={0} max={0.8} step={0.05} value={s.reduction} onChange={(e) => set(f.id, { reduction: Number(e.target.value) })} className="mt-1.5 w-full accent-[hsl(var(--brand))]" />
                  {f.leverText && <p className="mt-1 text-xs text-muted-foreground">Sugestão: {f.leverText} <span className="whitespace-nowrap">(até {pct(f.leverReduction ?? 0)})</span></p>}
                </div>
                <div>
                  {f.partner ? (
                    <label className={cn("flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 transition", s.partner && "border-brand bg-brand-soft")}>
                      <input type="checkbox" checked={s.partner} onChange={(e) => set(f.id, { partner: e.target.checked })} className="mt-0.5 size-4 accent-[hsl(var(--brand))]" />
                      <span className="text-xs">
                        <span className="block font-medium text-foreground">Enviar para {f.partner.name}</span>
                        <span className="text-muted-foreground">{num(f.partner.distanceKm, 1)} km · líquido de {money2(f.partner.netUnitValue)}/{f.unit} com frete</span>
                      </span>
                    </label>
                  ) : (
                    <p className="rounded-lg border border-dashed p-2.5 text-xs text-muted-foreground">Nenhum parceiro da rede aceita esse resíduo ainda.</p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="lg:sticky lg:top-20">
        <CardHeader title="Resultado do cenário" description="Comparado com o diagnóstico atual" />
        <div className="grid gap-4 px-5 pb-5">
          <div className="rounded-lg bg-subtle p-4">
            <p className="text-xs text-muted-foreground">Economia</p>
            <p className="tabular text-[28px] font-semibold leading-tight text-success">{money(saving)}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
            <p className="tabular text-[13px] text-muted-foreground">{money(saving * 12)} por ano</p>
          </div>
          {[
            ["Prejuízo mensal", money(base.loss), money(sim.loss)],
            ["Taxa de desperdício", pct(base.wasteRate, 1), pct(sim.wasteRate, 1)],
            ["Resíduo gerado", tons(base.wasteQty), tons(sim.wasteQty)],
            ["Circularidade", pct(base.circularity), pct(sim.circularity)],
          ].map(([l, a, b]) => (
            <div key={l} className="flex items-center justify-between gap-2 text-[13px]">
              <span className="text-muted-foreground">{l}</span>
              <span className="tabular"><span className="text-muted-foreground line-through decoration-muted-foreground/40">{a}</span> <span className="font-medium">{b}</span></span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t pt-4 text-[13px]">
            <span className="text-muted-foreground">CO₂e evitado</span>
            <Badge tone="success">{tons(Math.max(0, co2))}/mês</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
