"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { money, num, pct } from "@/lib/format";

const axis = { stroke: "hsl(var(--muted-foreground))", fontSize: 11, tickLine: false, axisLine: false } as const;

function Tip({ active, payload, label, fmt }: { active?: boolean; payload?: { value: number; name: string; color?: string; payload?: Record<string, unknown> }[]; label?: string; fmt: (v: number) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-pop">
      {label && <p className="mb-1 font-medium">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="tabular font-medium text-foreground">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

/** Prejuízo mensal com resíduos ao longo do tempo. */
export function LossTrend({ data }: { data: { label: string; loss: number; rate: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="lossFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--brand))" stopOpacity={0.28} />
            <stop offset="100%" stopColor="hsl(var(--brand))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <XAxis dataKey="label" {...axis} tickMargin={8} />
        <YAxis {...axis} width={56} tickFormatter={(v) => `${Math.round(v / 1000)} mil`} />
        <Tooltip content={<Tip fmt={money} />} cursor={{ stroke: "hsl(var(--border))" }} />
        <Area type="monotone" dataKey="loss" name="Prejuízo" stroke="hsl(var(--brand))" strokeWidth={2} fill="url(#lossFill)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Prejuízo por material (barras horizontais). */
export function LossByMaterial({ data }: { data: { name: string; loss: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }} barCategoryGap={10}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" {...axis} width={150} tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }} />
        <Tooltip content={<Tip fmt={money} />} cursor={{ fill: "hsl(var(--muted))" }} />
        <Bar dataKey="loss" name="Prejuízo/mês" maxBarSize={22} radius={[0, 4, 4, 0]} fill="hsl(var(--brand))" />
      </BarChart>
    </ResponsiveContainer>
  );
}

const DEST_COLORS = ["hsl(var(--danger))", "hsl(var(--warning))", "hsl(var(--success))", "hsl(var(--info))", "hsl(var(--muted-foreground))"];

/** Destino da massa de resíduo. */
export function DestinationDonut({ data }: { data: { name: string; value: number; circular: boolean }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const sorted = [...data].sort((a, b) => Number(a.circular) - Number(b.circular) || b.value - a.value);
  const colorFor = (d: { circular: boolean }, i: number) => (d.circular ? DEST_COLORS[2 + (i % 2)] : DEST_COLORS[i % 2]);
  return (
    <div className="grid items-center gap-4">
      <div className="mx-auto size-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={sorted} dataKey="value" nameKey="name" innerRadius={48} outerRadius={70} paddingAngle={2} stroke="none">
              {sorted.map((d, i) => <Cell key={d.name} fill={colorFor(d, i)} />)}
            </Pie>
            <Tooltip content={<Tip fmt={(v) => `${num(v)} kg/L`} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="grid gap-2 text-[13px]">
        {sorted.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: colorFor(d, i) }} />
            <span className="min-w-0 flex-1 truncate">{d.name}</span>
            <span className="tabular text-muted-foreground">{pct(d.value / total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Sparkline({ values, color = "hsl(var(--brand))" }: { values: number[]; color?: string }) {
  const data = values.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={36}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={color} fillOpacity={0.08} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
