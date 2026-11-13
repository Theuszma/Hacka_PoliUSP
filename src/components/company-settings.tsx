"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { updateCompany, type ActionState } from "@/app/actions";
import { CITIES } from "@/lib/cities";
import { SECTORS } from "@/lib/sectors";
import { SubmitButton } from "./forms";
import { Field, Input, Select, Textarea } from "./ui/form";

export function CompanySettingsForm({ company }: { company: { name: string; cnpj: string | null; sector: string; size: string; employees: number; city: string; description: string | null } }) {
  const [state, action] = useActionState<ActionState, FormData>(updateCompany, null);
  const e = state?.errors ?? {};
  useEffect(() => { if (state?.ok) toast.success(state.message ?? "Salvo"); }, [state]);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <Field label="Razão social ou nome fantasia" htmlFor="s-name" error={e.name} className="sm:col-span-2"><Input id="s-name" name="name" defaultValue={company.name} /></Field>
      <Field label="CNPJ" htmlFor="s-cnpj" error={e.cnpj}><Input id="s-cnpj" name="cnpj" defaultValue={company.cnpj ?? ""} placeholder="00.000.000/0000-00" /></Field>
      <Field label="Setor" htmlFor="s-sector" error={e.sector}>
        <Select id="s-sector" name="sector" defaultValue={company.sector}>{Object.entries(SECTORS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</Select>
      </Field>
      <Field label="Porte" htmlFor="s-size">
        <Select id="s-size" name="size" defaultValue={company.size}><option value="Micro">Microempresa</option><option value="Pequena">Pequena empresa</option><option value="Média">Média empresa</option></Select>
      </Field>
      <Field label="Funcionários" htmlFor="s-emp" error={e.employees}><Input id="s-emp" name="employees" type="number" min={1} defaultValue={company.employees} /></Field>
      <Field label="Cidade" htmlFor="s-city" className="sm:col-span-2">
        <Select id="s-city" name="city" defaultValue={company.city}>
          {!CITIES.some((c) => c.name === company.city) && <option>{company.city}</option>}
          {CITIES.map((c) => <option key={c.name}>{c.name}</option>)}
        </Select>
      </Field>
      <Field label="O que a empresa produz" htmlFor="s-desc" error={e.description} className="sm:col-span-2"><Textarea id="s-desc" name="description" rows={3} defaultValue={company.description ?? ""} /></Field>
      <div className="flex justify-end sm:col-span-2"><SubmitButton pendingText="Salvando…">Salvar alterações</SubmitButton></div>
    </form>
  );
}
