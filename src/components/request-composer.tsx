"use client";

import { Send } from "lucide-react";
import { useActionState, useState } from "react";
import { createRequest, type ActionState } from "@/app/actions";
import { CATEGORIES, CATEGORY_KEYS } from "@/lib/catalog";
import { SubmitButton } from "./forms";
import { Button, type ButtonProps } from "./ui/button";
import { Field, Input, Select, Textarea } from "./ui/form";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "./ui/overlay";

export interface ComposerDefaults { title: string; category: string; briefing: string; hours: number }

function ComposerForm({ defaults, invited }: { defaults: ComposerDefaults; invited?: { id: string; name: string } }) {
  const [state, action] = useActionState<ActionState, FormData>(createRequest, null);
  const e = state?.errors ?? {};
  return (
    <form action={action} className="grid gap-4">
      {invited && <input type="hidden" name="invitedId" value={invited.id} />}
      <Field label="Título" htmlFor="rq-title" error={e.title}><Input id="rq-title" name="title" defaultValue={defaults.title} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Área" htmlFor="rq-cat" error={e.category}>
          <Select id="rq-cat" name="category" defaultValue={defaults.category}>{CATEGORY_KEYS.map((k) => <option key={k} value={k}>{CATEGORIES[k].label}</option>)}</Select>
        </Field>
        <Field label="Horas estimadas" htmlFor="rq-h" error={e.estimatedHours}><Input id="rq-h" name="estimatedHours" type="number" min={2} max={200} defaultValue={defaults.hours} /></Field>
      </div>
      <Field label="Briefing" htmlFor="rq-b" error={e.briefing} hint="Gerado a partir do seu diagnóstico. Edite à vontade.">
        <Textarea id="rq-b" name="briefing" rows={9} defaultValue={defaults.briefing} className="font-mono text-[12.5px] leading-relaxed" />
      </Field>
      {state?.message && !state.ok && <p className="text-[13px] text-danger">{state.message}</p>}
      <div className="flex justify-end gap-2">
        <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
        <SubmitButton pendingText="Publicando…"><Send />{invited ? `Convidar ${invited.name.split(" ")[0]}` : "Publicar demanda"}</SubmitButton>
      </div>
    </form>
  );
}

export function RequestComposer({ defaults, invited, label, ...btn }: { defaults: ComposerDefaults; invited?: { id: string; name: string }; label: string } & ButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button {...btn}>{label}</Button></DialogTrigger>
      <DialogContent wide title={invited ? `Convidar ${invited.name}` : "Nova demanda de engenharia"} description={invited ? "A pessoa recebe o convite e a demanda também fica visível para a rede." : "A demanda fica visível para estudantes e mentores da rede, ordenada por aderência."}>
        {open && <ComposerForm defaults={defaults} invited={invited} />}
      </DialogContent>
    </Dialog>
  );
}
