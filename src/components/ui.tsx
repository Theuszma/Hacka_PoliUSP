import type { ReactNode } from "react";
import { destination } from "@/lib/catalog";

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true" className="shrink-0">
      <rect width="34" height="34" rx="8" className="fill-accent" />
      <circle cx="13" cy="17" r="6.5" fill="none" strokeWidth="3" className="stroke-accent-ink" />
      <circle cx="21" cy="17" r="6.5" fill="none" strokeWidth="3" className="stroke-accent-ink" />
    </svg>
  );
}

export function PageHeader({ eyebrow, title, children, actions }: { eyebrow?: string; title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-2xl">
        {eyebrow && <p className="label mb-1">{eyebrow}</p>}
        <h1 className="text-2xl font-bold sm:text-[28px]">{title}</h1>
        {children && <div className="mt-1.5 text-muted">{children}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Kpi({ label, value, unit, hint, tone }: { label: string; value: ReactNode; unit?: string; hint?: ReactNode; tone?: "accent" | "good" }) {
  const ring = tone === "accent" ? "border-accent shadow-[inset_4px_0_0_rgb(var(--accent))]" : tone === "good" ? "border-good shadow-[inset_4px_0_0_rgb(var(--good))]" : "";
  return (
    <div className={`card grid gap-1 p-4 ${ring}`}>
      <span className="label">{label}</span>
      <span className="font-display text-[28px] font-extrabold leading-tight tabular-nums">
        {value}
        {unit && <span className="ml-1 font-sans text-sm font-medium text-muted">{unit}</span>}
      </span>
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </div>
  );
}

const pillTone = {
  accent: "bg-accent-soft text-accent",
  good: "bg-good-soft text-good",
  bad: "bg-bad-soft text-bad",
  warn: "bg-ochre-soft text-ochre",
  muted: "bg-sunken text-muted",
};
export function Pill({ tone, children }: { tone: keyof typeof pillTone; children: ReactNode }) {
  return <span className={`pill ${pillTone[tone]}`}>{children}</span>;
}

export function DestinationPill({ value }: { value: string }) {
  const d = destination(value);
  const tone = value === "simbiose" || value === "reuso" ? "good" : d.circular ? "warn" : "bad";
  return <Pill tone={tone}>{d.label}</Pill>;
}

export function RequestStatus({ status }: { status: string }) {
  if (status === "OPEN") return <Pill tone="accent">Aberta</Pill>;
  if (status === "IN_PROGRESS") return <Pill tone="warn">Em andamento</Pill>;
  return <Pill tone="good">Concluída</Pill>;
}

export function ExchangeStatus({ status }: { status: string }) {
  if (status === "PROPOSED") return <Pill tone="warn">Proposta enviada</Pill>;
  if (status === "ACCEPTED") return <Pill tone="good">Troca ativa</Pill>;
  return <Pill tone="muted">Recusada</Pill>;
}

export function Empty({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="grid justify-items-center gap-3 rounded-card border border-dashed border-line p-8 text-center text-sm text-muted">
      <p className="max-w-md">{children}</p>
      {action}
    </div>
  );
}

export function Avatar({ text, tone = "ink" }: { text: string; tone?: "ink" | "ochre" | "accent" }) {
  const bg = tone === "ochre" ? "bg-ochre text-surface" : tone === "accent" ? "bg-accent text-accent-ink" : "bg-ink text-bg";
  return <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg font-display text-sm font-extrabold ${bg}`}>{text}</span>;
}

export function initials(name: string) {
  return name.split(/\s+/).filter((w) => w.length > 2 || /^[A-Z]/.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export function Section({ title, aside, children, className = "" }: { title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card min-w-0 ${className}`}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold">{title}</h2>
        {aside && <div className="text-xs text-muted">{aside}</div>}
      </div>
      {children}
    </section>
  );
}

export function Arrow() {
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true" className="shrink-0 text-muted">
      <path d="M0 6h15M11 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
