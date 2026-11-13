import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export function Separator({ className, vertical }: { className?: string; vertical?: boolean }) {
  return <div role="separator" className={cn("shrink-0 bg-border", vertical ? "h-full w-px" : "h-px w-full", className)} />;
}

export function Skeleton({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...p} />;
}

/** value de 0 a 100 */
export function Progress({ value, className, tone = "brand" }: { value: number; className?: string; tone?: "brand" | "warning" | "danger" }) {
  const bg = tone === "danger" ? "bg-danger" : tone === "warning" ? "bg-warning" : "bg-brand";
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full transition-all", bg)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

const palette = ["bg-emerald-600", "bg-sky-600", "bg-violet-600", "bg-amber-600", "bg-rose-600", "bg-teal-600", "bg-indigo-600", "bg-zinc-700"];
export function Avatar({ name, size = 32, className, square }: { name: string; size?: number; className?: string; square?: boolean }) {
  const letters = name.split(/\s+/).filter(Boolean).filter((w, i) => i === 0 || w.length > 2).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return (
    <span
      aria-hidden="true"
      className={cn("inline-grid shrink-0 place-items-center font-semibold text-white", square ? "rounded-md" : "rounded-full", palette[Math.abs(h) % palette.length], className)}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.38) }}
    >
      {letters}
    </span>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="pointer-events-none inline-flex h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">{children}</kbd>;
}

export function EmptyState({ icon, title, description, action, className }: { icon?: ReactNode; title: string; description?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("grid justify-items-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center", className)}>
      {icon && <div className="mb-1 grid size-10 place-items-center rounded-full bg-muted text-muted-foreground [&_svg]:size-5">{icon}</div>}
      <p className="font-medium">{title}</p>
      {description && <p className="max-w-sm text-[13px] text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
