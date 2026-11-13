"use client";

import { Plus, Trash2 } from "lucide-react";
import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteInputDemand, saveInputDemand, type ActionState } from "@/app/actions";
import { CATEGORIES, CATEGORY_KEYS } from "@/lib/catalog";
import { SubmitButton } from "./forms";
import { Button } from "./ui/button";
import { Field, Input, Select } from "./ui/form";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "./ui/overlay";

function DemandForm({ onSaved }: { onSaved: () => void }) {
  const [state, action] = useActionState<ActionState, FormData>(saveInputDemand, null);
  const [cat, setCat] = useState<string>("aco");
  const e = state?.errors ?? {};
  const c = CATEGORIES[cat as keyof typeof CATEGORIES];
  useEffect(() => {
    if (state?.ok) { toast.success(state.message ?? "Salvo"); onSaved(); }
  }, [state, onSaved]);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <Field label="Material" htmlFor="d-cat" error={e.category}>
        <Select id="d-cat" name="category" value={cat} onChange={(ev) => setCat(ev.target.value)}>
          {CATEGORY_KEYS.map((k) => <option key={k} value={k}>{CATEGORIES[k].label}</option>)}
        </Select>
      </Field>
      <Field label="Descrição" htmlFor="d-desc" error={e.description}><Input id="d-desc" name="description" placeholder="Ex.: retalhos de chapa acima de 30 cm" /></Field>
      <Field label="Como vai usar" htmlFor="d-use" error={e.use} className="sm:col-span-2"><Input id="d-use" name="use" placeholder="Ex.: estampar arruelas e pequenas peças" /></Field>
      <Field label={`Paga quanto por ${c.unit} (R$)`} htmlFor="d-pp" error={e.pricePaid} hint="Negativo se cobra para receber"><Input id="d-pp" name="pricePaid" type="number" step="any" defaultValue={0} /></Field>
      <Field label={`Preço do material novo (R$/${c.unit})`} htmlFor="d-vp" error={e.virginPrice}><Input id="d-vp" name="virginPrice" type="number" step="any" min={0} /></Field>
      <Field label={`Quantidade por mês (${c.unit})`} htmlFor="d-cap" error={e.capacity}><Input id="d-cap" name="capacity" type="number" step="any" min={0} /></Field>
      <Field label="Substitui matéria-prima nova (%)" htmlFor="d-sub" error={e.substitution}><Input id="d-sub" name="substitution" type="number" min={0} max={100} defaultValue={80} /></Field>
      {c.hazardous && (
        <label className="flex items-center gap-2 text-[13px] sm:col-span-2">
          <input type="checkbox" name="licensed" className="size-4 accent-[hsl(var(--brand))]" />Tenho licença ambiental para receber resíduo Classe I
        </label>
      )}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
        <SubmitButton pendingText="Salvando…">Publicar demanda</SubmitButton>
      </div>
    </form>
  );
}

export function AddDemandButton({ variant = "outline" }: { variant?: "outline" | "default" }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant={variant} size="sm"><Plus />Material que aceito</Button></DialogTrigger>
      <DialogContent wide title="O que sua fábrica aceita receber" description="O Elo cruza isso com os resíduos das outras empresas da rede e avisa quando houver parceiro.">
        {open && <DemandForm onSaved={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

export function DeleteDemandButton({ id, label }: { id: string; label: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <Button variant="ghost" size="icon-sm" aria-label={`Remover ${label}`} disabled={pending} onClick={() => start(async () => {
      const fd = new FormData(); fd.set("id", id); await deleteInputDemand(fd); toast.success("Demanda removida"); router.refresh();
    })}><Trash2 /></Button>
  );
}
