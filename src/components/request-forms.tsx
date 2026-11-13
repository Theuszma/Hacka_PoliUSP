"use client";

import { useActionState, useEffect, useRef } from "react";
import { completeRequest, postUpdate, type ActionState } from "@/app/actions";
import { SubmitButton } from "./client";

export function UpdateForm({ requestId }: { requestId: string }) {
  const [state, action] = useActionState<ActionState, FormData>(postUpdate, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok) ref.current?.reset(); }, [state]);
  return (
    <form ref={ref} action={action} className="grid gap-2">
      <input type="hidden" name="id" value={requestId} />
      <label htmlFor="upd-body" className="field-label">Nova mensagem</label>
      <textarea id="upd-body" name="body" rows={3} className="input" placeholder="Atualize a empresa ou a equipe sobre o andamento" />
      {state?.errors?.body && <p className="field-error">{state.errors.body}</p>}
      {state?.message && <p className="field-error">{state.message}</p>}
      <div><SubmitButton pendingText="Enviando…">Enviar</SubmitButton></div>
    </form>
  );
}

export function CompleteForm({ requestId }: { requestId: string }) {
  const [state, action] = useActionState<ActionState, FormData>(completeRequest, null);
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="id" value={requestId} />
      <div>
        <label htmlFor="cmp-out" className="field-label">O que foi feito e qual o resultado</label>
        <textarea id="cmp-out" name="outcome" rows={3} className="input" />
        {state?.errors?.outcome && <p className="field-error">{state.errors.outcome}</p>}
      </div>
      <div className="max-w-xs">
        <label htmlFor="cmp-saved" className="field-label">Economia mensal validada com a empresa (R$)</label>
        <input id="cmp-saved" name="savedPerMonth" type="number" min={0} step="any" className="input" />
        {state?.errors?.savedPerMonth && <p className="field-error">{state.errors.savedPerMonth}</p>}
      </div>
      {state?.message && <p className={`text-sm ${state.ok ? "text-good" : "text-bad"}`}>{state.message}</p>}
      <div><SubmitButton className="btn border-good bg-good text-surface hover:border-good" pendingText="Concluindo…">Concluir demanda</SubmitButton></div>
    </form>
  );
}
