import { pct, num } from "@/lib/format";
import { flowMetrics, type FlowInput } from "@/lib/metrics";

/** Barras horizontais: quanto de cada insumo vira produto e quanto vira resíduo (e para onde vai). */
export function FlowBars({ flows }: { flows: FlowInput[] }) {
  const rows = flows.map((f) => ({ f, m: flowMetrics(f) })).sort((a, b) => b.m.loss - a.m.loss);
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-ink/20" />Vira produto</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-good" />Resíduo reaproveitado</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-bad" />Resíduo descartado</span>
      </div>
      {rows.map(({ f, m }) => (
        <div key={f.id} className="grid grid-cols-[minmax(0,1fr)_72px] items-center gap-x-3 gap-y-1.5 sm:grid-cols-[180px_minmax(0,1fr)_72px]">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{f.name}</p>
            <p className="text-xs text-muted">{num(f.monthlyQty)} {f.unit}/mês</p>
          </div>
          <div
            className="col-span-2 row-start-2 flex h-5 overflow-hidden rounded bg-sunken sm:col-span-1 sm:row-start-auto"
            role="img"
            aria-label={`${f.name}: ${pct(1 - f.lossRate)} vira produto, ${pct(f.lossRate)} vira resíduo`}
          >
            <i className="block h-full bg-ink/20" style={{ width: `${(1 - f.lossRate) * 100}%` }} />
            <i className={`block h-full ${m.circular ? "bg-good" : "bg-bad"}`} style={{ width: `${f.lossRate * 100}%` }} />
          </div>
          <p className="num row-start-1 text-right text-sm sm:row-start-auto">{pct(f.lossRate)}</p>
        </div>
      ))}
    </div>
  );
}

export interface MapNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  kind: "out" | "in" | "active" | "other";
}

/** Mapa esquemático (projeção equirretangular local) com anéis de distância. */
export function NetworkMap({ center, nodes, rings = [5, 10, 20] }: { center: { lat: number; lng: number; label: string }; nodes: MapNode[]; rings?: number[] }) {
  const W = 640, H = 380, cx = W / 2, cy = H / 2;
  const kmPerDegLat = 111.32;
  const kmPerDegLng = 111.32 * Math.cos((center.lat * Math.PI) / 180);
  // Escala radial em raiz quadrada: abre espaço para os vizinhos próximos sem esconder os distantes.
  const R = Math.min(W, H) / 2 - 22;
  const offset = (lat: number, lng: number) => ({ dx: (lng - center.lng) * kmPerDegLng, dy: (lat - center.lat) * kmPerDegLat });
  const maxKm = Math.max(rings[rings.length - 1], ...nodes.map((n) => { const o = offset(n.lat, n.lng); return Math.hypot(o.dx, o.dy); })) * 1.05;
  const radius = (km: number) => Math.sqrt(km / maxKm) * R;
  const project = (lat: number, lng: number) => {
    const o = offset(lat, lng);
    const km = Math.hypot(o.dx, o.dy) || 1e-6;
    const r = radius(km);
    return { x: cx + (o.dx / km) * r * 1.35, y: cy - (o.dy / km) * r };
  };
  const color = { out: "rgb(var(--accent))", in: "rgb(var(--ochre))", active: "rgb(var(--good))", other: "rgb(var(--muted))" };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Mapa das empresas parceiras ao redor da sua fábrica">
      {rings.map((r) => (
        <g key={r}>
          <ellipse cx={cx} cy={cy} rx={radius(r) * 1.35} ry={radius(r)} fill="none" stroke="rgb(var(--line))" strokeDasharray="3 5" />
          <text x={cx + 4} y={cy - radius(r) - 4} className="fill-muted font-mono text-[10px]">{r} km</text>
        </g>
      ))}
      {nodes.map((n) => {
        const p = project(n.lat, n.lng);
        return n.kind === "other" ? null : (
          <line key={`l-${n.id}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={color[n.kind]} strokeWidth={n.kind === "active" ? 2.5 : 1.4} strokeDasharray={n.kind === "active" ? undefined : "5 4"} />
        );
      })}
      {placeLabels(nodes.map((n) => ({ n, p: project(n.lat, n.lng) })), cx).map(({ n, p, lx, ly, anchor }) => (
        <g key={n.id}>
          <circle cx={p.x} cy={p.y} r={n.kind === "other" ? 4 : 6.5} fill={color[n.kind]}><title>{n.name}</title></circle>
          {n.kind !== "other" && (
            <>
              {Math.abs(ly - p.y - 4) > 2 && <line x1={p.x} y1={p.y} x2={lx - (anchor === "end" ? -4 : 4)} y2={ly - 4} stroke="rgb(var(--line))" />}
              <text x={lx} y={ly} textAnchor={anchor} className="fill-ink text-[11px]">{n.name}</text>
            </>
          )}
        </g>
      ))}
      <circle cx={cx} cy={cy} r={17} fill="rgb(var(--accent))" />
      <text x={cx} y={cy + 4} textAnchor="middle" className="fill-accent-ink font-display text-[11px] font-bold">{center.label}</text>
    </svg>
  );
}

/** Posiciona rótulos à esquerda ou à direita do ponto, empurrando para baixo os que colidem. */
function placeLabels<T extends { n: MapNode; p: { x: number; y: number } }>(items: T[], cx: number) {
  const placed: { side: "start" | "end"; y: number }[] = [];
  return [...items]
    .sort((a, b) => a.p.y - b.p.y)
    .map((it) => {
      const anchor: "start" | "end" = it.p.x < cx - 8 ? "end" : "start";
      let ly = it.p.y + 4;
      if (it.n.kind !== "other") {
        while (placed.some((q) => q.side === anchor && Math.abs(q.y - ly) < 13)) ly += 13;
        placed.push({ side: anchor, y: ly });
      }
      return { ...it, anchor, lx: it.p.x + (anchor === "end" ? -10 : 10), ly };
    });
}
