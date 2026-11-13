"use client";

import { CheckCircle2, Send } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { completeRequest, postUpdate, type ActionState } from "@/app/actions";
import { SubmitButton } from "./forms";
import { Button } from "./ui/button";
import { Field, Input, Textarea } from "./ui/form";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "./ui/overlay";

export function MessageForm({ id }: { id: string }) {
  const [state, action] = useActionState<ActionState, FormData>(postUpdate, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
    else if (state?.message) toast.error(state.message);
  }, [state]);
  return (
    <form ref={ref} action={action} className="grid gap-2">
      <input type="hidden" name="id" value={id} />
      <Textarea name="body" rows={3} placeholder="Escreva uma atualização, dúvida ou próximo passo…" aria-label="Mensagem"
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit(); }} />
      {state?.errors?.body && <p className="text-xs text-danger">{state.errors.body}</p>}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Ctrl + Enter para enviar</span>
        <SubmitButton size="sm" pendingText="Enviando…"><Send />Enviar</SubmitButton>
      </div>
    </form>
  );
}

function CompleteForm({ id }: { id: string }) {
  const [state, action] = useActionState<ActionState, FormData>(completeRequest, null);
  const e = state?.errors ?? {};
  useEffect(() => {
    if (state?.ok) toast.success(state.message ?? "Concluída");
    else if (state?.message) toast.error(state.message);
  }, [state]);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="id" value={id} />
      <Field label="O que foi feito e qual o resultado" htmlFor="c-out" error={e.outcome}><Textarea id="c-out" name="outcome" rows={4} placeholder="Ex.: novo plano de corte reduziu a perda de 18% para 11%, validado em 3 semanas de produção" /></Field>
      <Field label="Economia mensal validada com a empresa (R$)" htmlFor="c-sav" error={e.savedPerMonth}><Input id="c-sav" name="savedPerMonth" type="number" min={0} step="any" /></Field>
      <div className="flex justify-end gap-2">
        <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
        <SubmitButton variant="brand" pendingText="Concluindo…">Concluir demanda</SubmitButton>
      </div>
    </form>
  );
}

export function CompleteButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="brand" className="w-full"><CheckCircle2 />Concluir demanda</Button></DialogTrigger>
      <DialogContent title="Concluir demanda" description="O resultado fica no histórico da empresa e as horas vão para o seu relatório de extensão.">
        {open && <CompleteForm id={id} />}
      </DialogContent>
    </Dialog>
  );
}
