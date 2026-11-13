import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { destination } from "@/lib/catalog";
import type { MethodKey } from "@/lib/engine/methods";
import { HowCalculated } from "./how";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { cn } from "./ui/cn";

const STAT_TONES = {
  neutral: "bg-muted text-muted-foreground",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
} as const;

export function Stat({ label, value, unit, hint, delta, deltaGood, icon, className, tone = "neutral", method }: {
  label: string; value: ReactNode; unit?: string; hint?: ReactNode; delta?: string | null; deltaGood?: boolean; icon?: ReactNode; className?: string; tone?: keyof typeof STAT_TONES; method?: MethodKey;
}) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-center justify-between gap-2 text-[13px] font-medium text-muted-foreground">
        <span className="flex items-center gap-1">{label}{method && <HowCalculated method={method} />}</span>
        {icon && <span className={cn("grid size-8 place-items-center rounded-lg [&_svg]:size-4", STAT_TONES[tone])}>{icon}</span>}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="tabular text-[26px] font-semibold leading-none tracking-tight">{value}</span>
        {unit && <span className="text-[13px] text-muted-foreground">{unit}</span>}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {delta && (
          <span className={cn("inline-flex items-center gap-0.5 font-medium", deltaGood ? "text-success" : "text-danger")}>
            {deltaGood ? <ArrowDownRight className="size-3.5" /> : <ArrowUpRight className="size-3.5" />}
            {delta}
          </span>
        )}
        {hint}
      </div>
    </Card>
  );
}

export function DestinationBadge({ value }: { value: string }) {
  const d = destination(value);
  const tone = value === "simbiose" || value === "reuso" ? "success" : d.circular ? "warning" : "danger";
  return <Badge tone={tone} dot>{d.label}</Badge>;
}

export function RequestStatusBadge({ status }: { status: string }) {
  if (status === "OPEN") return <Badge tone="info" dot>Aberta</Badge>;
  if (status === "IN_PROGRESS") return <Badge tone="warning" dot>Em andamento</Badge>;
  if (status === "REVIEW") return <Badge tone="brand" dot>Em revisão</Badge>;
  return <Badge tone="success" dot>Concluída</Badge>;
}

export function ExchangeStatusBadge({ status, waitingMe }: { status: string; waitingMe?: boolean }) {
  if (status === "PROPOSED") return <Badge tone="warning" dot>{waitingMe ? "Aguardando você" : "Proposta enviada"}</Badge>;
  if (status === "ACCEPTED") return <Badge tone="success" dot>Troca ativa</Badge>;
  return <Badge>Recusada</Badge>;
}

export interface MapNode { id: string; name: string; lat: number; lng: number; kind: "out" | "in" | "active" | "other" }

/** Mapa esquemático com escala radial em raiz quadrada e rótulos sem colisão. */
export function NetworkMap({ center, nodes, rings = [5, 10, 20] }: { center: { lat: number; lng: number; label: string }; nodes: MapNode[]; rings?: number[] }) {
  const W = 640, H = 360, cx = W / 2, cy = H / 2;
  const kmLat = 111.32, kmLng = 111.32 * Math.cos((center.lat * Math.PI) / 180);
  const off = (lat: number, lng: number) => ({ dx: (lng - center.lng) * kmLng, dy: (lat - center.lat) * kmLat });
  const maxKm = Math.max(rings[rings.length - 1], ...nodes.map((n) => { const o = off(n.lat, n.lng); return Math.hypot(o.dx, o.dy); })) * 1.05;
  const R = Math.min(W, H) / 2 - 20;
  const radius = (km: number) => Math.sqrt(km / maxKm) * R;
  const project = (lat: number, lng: number) => {
    const o = off(lat, lng); const km = Math.hypot(o.dx, o.dy) || 1e-6; const r = radius(km);
    return { x: cx + (o.dx / km) * r * 1.4, y: cy - (o.dy / km) * r };
  };
  const color = { out: "hsl(var(--brand))", in: "hsl(var(--info))", active: "hsl(var(--success))", other: "hsl(var(--muted-foreground) / 0.5)" };
  const placed: { side: string; y: number }[] = [];
  const pts = nodes.map((n) => ({ n, p: project(n.lat, n.lng) })).sort((a, b) => a.p.y - b.p.y).map(({ n, p }) => {
    const anchor = p.x < cx - 8 ? "end" : "start";
    let ly = p.y + 4;
    if (n.kind !== "other") { while (placed.some((q) => q.side === anchor && Math.abs(q.y - ly) < 13)) ly += 13; placed.push({ side: anchor, y: ly }); }
    return { n, p, anchor, ly, lx: p.x + (anchor === "end" ? -10 : 10) };
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Mapa das empresas parceiras ao redor da sua fábrica">
      <defs>
        <radialGradient id="glow"><stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity="0.12" /><stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy} rx={R * 1.4} ry={R} fill="url(#glow)" />
      {rings.map((r) => (
        <g key={r}>
          <ellipse cx={cx} cy={cy} rx={radius(r) * 1.4} ry={radius(r)} fill="none" stroke="hsl(var(--border))" strokeDasharray="2 4" />
          <text x={cx + 4} y={cy - radius(r) - 4} fill="hsl(var(--muted-foreground))" fontSize="10" fontFamily="Geist Mono, monospace">{r} km</text>
        </g>
      ))}
      {pts.filter(({ n }) => n.kind !== "other").map(({ n, p }) => (
        <line key={`l-${n.id}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={color[n.kind]} strokeWidth={n.kind === "active" ? 2 : 1.2} strokeDasharray={n.kind === "active" ? undefined : "4 4"} />
      ))}
      {pts.map(({ n, p, anchor, lx, ly }) => (
        <g key={n.id}>
          <circle cx={p.x} cy={p.y} r={n.kind === "other" ? 3.5 : 5.5} fill={color[n.kind]} stroke="hsl(var(--card))" strokeWidth="2"><title>{n.name}</title></circle>
          {n.kind !== "other" && <text x={lx} y={ly} textAnchor={anchor} fill="hsl(var(--foreground))" fontSize="11.5" fontWeight="500">{n.name}</text>}
        </g>
      ))}
      <circle cx={cx} cy={cy} r={16} fill="hsl(var(--foreground))" />
      <text x={cx} y={cy + 4} textAnchor="middle" fill="hsl(var(--background))" fontSize="11" fontWeight="700">{center.label}</text>
    </svg>
  );
}
