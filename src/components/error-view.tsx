"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "./ui/button";

export function ErrorView({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="mx-auto grid max-w-md justify-items-center gap-3 py-24 text-center">
      <div className="grid size-11 place-items-center rounded-full bg-danger-soft text-danger"><AlertTriangle className="size-5" /></div>
      <h1 className="text-lg font-semibold">Algo deu errado</h1>
      <p className="text-[13.5px] text-muted-foreground">Não conseguimos carregar esta página. Tente de novo; se continuar, recarregue o navegador.</p>
      {error.digest && <p className="font-mono text-[11px] text-muted-foreground">código {error.digest}</p>}
      <Button onClick={reset} variant="outline"><RotateCcw />Tentar de novo</Button>
    </div>
  );
}
