"use client";

import Link from "next/link";
import { Info } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/overlay";
import { METHODS, type MethodKey } from "@/lib/engine/methods";
import { SOURCES } from "@/lib/engine/sources";

/** Ícone "como calculamos": abre a fórmula, as premissas e as fontes de um indicador. */
export function HowCalculated({ method, className }: { method: MethodKey; className?: string }) {
  const m = METHODS[method];
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" aria-label={`Como calculamos: ${m.title}`} className={className ?? "inline-grid size-5 place-items-center rounded-full text-muted-foreground transition hover:bg-subtle hover:text-foreground print:hidden"}>
          <Info className="size-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent title={`Como calculamos: ${m.title}`} description={m.explanation}>
        <MethodBody method={method} />
        <Link href={`/metodologia#${method}`} className="mt-4 inline-block text-[13px] font-medium text-brand hover:underline">Ver a metodologia completa</Link>
      </DialogContent>
    </Dialog>
  );
}

export function MethodBody({ method }: { method: MethodKey }) {
  const m = METHODS[method];
  const assumptions: readonly string[] = "assumptions" in m ? m.assumptions : [];
  return (
    <div className="grid gap-4 text-[13px]">
      <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-subtle p-3 font-mono text-xs leading-relaxed">{m.formula}</pre>
      {assumptions.length > 0 && (
        <div>
          <p className="mb-1 font-medium">Premissas</p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">{assumptions.map((a) => <li key={a}>{a}</li>)}</ul>
        </div>
      )}
      {m.sources.length > 0 && (
        <div>
          <p className="mb-1 font-medium">Fontes</p>
          <ul className="space-y-1 text-muted-foreground">
            {m.sources.map((id) => {
              const s = SOURCES[id];
              return <li key={id}>{"url" in s ? <a href={s.url} target="_blank" rel="noreferrer" className="hover:underline">{s.citation}</a> : s.citation}</li>;
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
