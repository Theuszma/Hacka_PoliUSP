"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { completeEngineerOnboarding, type ActionState } from "@/app/actions";
import { CATEGORIES } from "@/lib/catalog";
import { CITIES } from "@/lib/cities";
import { SubmitButton } from "./forms";
import { Card } from "./ui/card";
import { cn } from "./ui/cn";
import { Field, Input, Select, Textarea } from "./ui/form";

const BASE_SKILLS = [...Object.values(CATEGORIES).flatMap((c) => c.skills), "lean", "layout", "IoT", "sensores", "rastreabilidade", "PGRS", "inventário GEE", "ferramentaria"];

export interface EngineerProfile { kind: string; course: string; bio: string; skills: string[]; hoursPerWeek: number; city: string }

export function EngineerProfileForm({ initial }: { initial?: EngineerProfile }) {
  const [state, action] = useActionState<ActionState, FormData>(completeEngineerOnboarding, null);
  const [kind, setKind] = useState(initial?.kind ?? "STUDENT");
  const [skills, setSkills] = useState<string[]>(initial?.skills ?? []);
  useEffect(() => { if (state?.ok && state.message) toast.success(state.message); }, [state]);
  const e = state?.errors ?? {};
  const allSkills = Array.from(new Set([...BASE_SKILLS, ...skills])).sort();
  const toggle = (s: string) => setSkills((xs) => (xs.includes(s) ? xs.filter((x) => x !== s) : [...xs, s]));
  return (
      <form action={action}>
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="skills" value={skills.join(", ")} />
        <Card className="grid gap-5 p-6">
          <div className="grid grid-cols-2 gap-2">
            {[["STUDENT", "Estudante", "Graduação ou pós"], ["MENTOR", "Mentor(a)", "Engenheiro(a) formado(a)"]].map(([v, t, d]) => (
              <button key={v} type="button" onClick={() => setKind(v)} className={cn("rounded-lg border p-3 text-left transition", kind === v ? "border-foreground bg-subtle ring-1 ring-foreground" : "hover:bg-subtle")}>
                <span className="block text-[13px] font-medium">{t}</span><span className="text-xs text-muted-foreground">{d}</span>
              </button>
            ))}
          </div>
          <Field label={kind === "STUDENT" ? "Curso e ano" : "Formação e experiência"} htmlFor="eo-course" error={e.course}>
            <Input id="eo-course" name="course" defaultValue={initial?.course} placeholder={kind === "STUDENT" ? "Eng. de Produção · Poli, 3º ano" : "Eng. Mecânico · 15 anos em manufatura"} />
          </Field>
          <Field label="Sobre você" htmlFor="eo-bio" error={e.bio}><Textarea id="eo-bio" name="bio" rows={3} defaultValue={initial?.bio} placeholder="Projetos, estágios, pesquisas, o que você quer aplicar" /></Field>
          <div className="grid gap-2">
            <p className="text-[13px] font-medium">Áreas técnicas</p>
            <div className="flex flex-wrap gap-1.5">
              {allSkills.map((s) => (
                <button key={s} type="button" onClick={() => toggle(s)} aria-pressed={skills.includes(s)}
                  className={cn("rounded-full border px-2.5 py-1 text-xs transition", skills.includes(s) ? "border-brand bg-brand-soft font-medium text-brand" : "text-muted-foreground hover:bg-subtle")}>
                  {s}
                </button>
              ))}
            </div>
            {e.skills && <p className="text-xs font-medium text-danger">{e.skills}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Horas disponíveis por semana" htmlFor="eo-hours" error={e.hoursPerWeek}><Input id="eo-hours" name="hoursPerWeek" type="number" min={1} max={40} defaultValue={initial?.hoursPerWeek ?? 6} /></Field>
            <Field label="Cidade" htmlFor="eo-city">
              <Select id="eo-city" name="city" defaultValue={initial?.city ?? "São Paulo"}>{CITIES.map((c) => <option key={c.name}>{c.name}</option>)}</Select>
            </Field>
          </div>
          <div className="flex justify-end"><SubmitButton variant={initial ? "default" : "brand"} pendingText="Salvando…">{initial ? "Salvar perfil" : "Concluir perfil"}</SubmitButton></div>
        </Card>
      </form>
  );
}

export function EngineerOnboarding({ name }: { name: string }) {
  return (
    <div className="grid gap-8">
      <div>
        <p className="text-[13px] text-muted-foreground">Olá, {name.split(" ")[0]}.</p>
        <h1 className="mt-1 text-2xl font-semibold">Monte seu perfil técnico</h1>
        <p className="mt-1 text-[13.5px] text-muted-foreground">Usamos suas áreas para recomendar as demandas de PMEs em que você mais pode ajudar.</p>
      </div>
      <EngineerProfileForm />
    </div>
  );
}
