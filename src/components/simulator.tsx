"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { money, num, pct, tons } from "@/lib/format";
import { flowMetrics, totals, type FlowInput, type FlowScenario } from "@/lib/metrics";
import { Kpi } from "./ui";

export interface SimFlow extends FlowInput {
  leverText: string | null;
  leverReduction: number | null;
  partner: { name: string; distanceKm: number; netUnitValue: number; substitution: number } | null;
}

type State = Record<string, { reduction: number; partner: boolean }>;

export function Simulator({ flows }: { flows: SimFlow[] }) {
  const [state, setState] = useState<State>({});

  const scenarios = useMemo(() => {
    const out: Record<string, FlowScenario> = {};
    for (const f of flows) {
      const s = state[f.id];
      if (!s) continue;
      out[f.id] = {
        reduction: s.reduction,
        alternative: s.partner && f.partner ? { destinationValue: f.partner.netUnitValue, substitution: f.partner.substitution } : null,
      };
    }
    return out;
  }, [flows, state]);

  const before = totals(flows);
  const after = totals(flows, scenarios);
  const yearly = (before.loss - after.loss) * 12;
  const co2 = (before.netCo2 - after.netCo2) * 12;

  const set = (id: string, patch: Partial<State[string]>) =>
    setState((s) => ({ ...s, [id]: { ...{ reduction: 0, partner: false }, ...s[id], ...patch } }));

  const applyTypical = () => {
    const next: State = {};
    for (const f of flows) next[f.id] = { reduction: f.leverReduction ?? 0, partner: !!f.partner };
    setState(next);
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={applyTypical}>Aplicar melhorias típicas</button>
        <button type="button" className="btn" onClick={() => setState({})}>Zerar cenário</button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Kpi tone="good" label="Economia estimada" value={money(yearly)} unit="/ano" hint="comparada à operação atual" />
        <Kpi label="CO₂e evitado" value={tons(co2)} unit="/ano" hint="menos desperdício e menos matéria-prima virgem nos parceiros" />
        <Kpi label="Circularidade" value={`${pct(before.circularity)} → ${pct(after.circularity)}`} hint="parcela do resíduo que volta para a economia" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="card min-w-0">
          <h2 className="mb-2 text-lg font-bold">Alavancas por insumo</h2>
          <div className="divide-y divide-line">
            {flows.map((f) => {
              const s = state[f.id] ?? { reduction: 0, partner: false };
              const m0 = flowMetrics(f);
              const m1 = flowMetrics(f, scenarios[f.id]);
              const gain = (m0.loss - m1.loss) * 12;
              return (
                <div key={f.id} className="grid gap-3 py-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-center">
                  <div className="min-w-0">
                    <p className="font-semibold">{f.name}</p>
                    <p className="text-xs text-muted">
                      {f.leverText ?? "Melhoria de processo a definir com um engenheiro"}
                      {f.leverReduction ? ` · típico: −${pct(f.leverReduction)}` : ""}
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor={`r-${f.id}`} className="flex justify-between gap-2 text-xs font-semibold text-muted">
                      <span>Reduzir perda em <span className="num text-ink">{pct(s.reduction)}</span></span>
                      <span className="num">{pct(f.lossRate, 1)} → <span className="text-ink">{pct(m1.lossRate, 1)}</span></span>
                    </label>
                    <input id={`r-${f.id}`} type="range" min={0} max={80} step={5} value={Math.round(s.reduction * 100)}
                      onChange={(e) => set(f.id, { reduction: Number(e.target.value) / 100 })} className="w-full accent-[rgb(var(--accent))]" />
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {f.partner ? (
                        <label className="flex items-center gap-2 text-xs">
                          <input type="checkbox" checked={s.partner} onChange={(e) => set(f.id, { partner: e.target.checked })} className="h-4 w-4 accent-[rgb(var(--good))]" />
                          Enviar para {f.partner.name} ({num(f.partner.distanceKm, 0)} km)
                        </label>
                      ) : (
                        <span className="text-xs text-muted">Sem parceiro de simbiose na região</span>
                      )}
                      <span className={`num text-xs font-semibold ${gain > 0 ? "text-good" : "text-muted"}`}>{gain > 0 ? `−${money(gain)}/ano` : "sem mudança"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card grid content-start gap-4">
          <h2 className="text-lg font-bold">Antes e depois, por mês</h2>
          <dl className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-4 gap-y-2 text-sm">
            <span /><span className="label text-right">Hoje</span><span className="label text-right">Cenário</span>
            {[
              ["Prejuízo com resíduo", money(before.loss), money(after.loss)],
              ["Taxa de desperdício", pct(before.wasteRate, 1), pct(after.wasteRate, 1)],
              ["Resíduo gerado", num(before.wasteQty), num(after.wasteQty)],
              ["Para descarte", num(before.landfillQty), num(after.landfillQty)],
              ["CO₂e líquido", tons(before.netCo2), tons(after.netCo2)],
            ].map(([k, a, b]) => (
              <div key={k} className="contents">
                <dt>{k}</dt>
                <dd className="num text-right">{a}</dd>
                <dd className={`num text-right font-semibold ${a !== b ? "text-good" : ""}`}>{b}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-muted">Resíduo em kg ou litros. As reduções dependem de intervenção técnica: valide o cenário com um engenheiro antes de investir.</p>
          <Link href="/empresa/engenheiros" className="btn justify-self-start">Ver engenheiros recomendados</Link>
        </section>
      </div>
    </div>
  );
}
