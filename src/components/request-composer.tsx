"use client";

import { useActionState, useRef, useState } from "react";
import { createRequest, type ActionState } from "@/app/actions";
import { CATEGORIES } from "@/lib/catalog";
import { SubmitButton } from "./client";
import { Avatar } from "./ui";

export interface EngineerCard {
  id: string;
  name: string;
  initials: string;
  kind: string;
  course: string;
  bio: string;
  skills: string[];
  matchedSkills: string[];
  hoursPerWeek: number;
  rating: number;
  helpsWith: string | null;
  score: number;
}

export function RequestComposer({ engineers, defaults }: {
  engineers: EngineerCard[];
  defaults: { title: string; briefing: string; category: string };
}) {
  const [state, action] = useActionState<ActionState, FormData>(createRequest, null);
  const [open, setOpen] = useState(false);
  const [invited, setInvited] = useState<EngineerCard | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const start = (e: EngineerCard | null) => {
    setInvited(e);
    setOpen(true);
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const err = (k: string) => state?.errors?.[k] && <p className="field-error">{state.errors[k]}</p>;

  return (
    <div className="grid gap-6">
      <div ref={formRef} className="scroll-mt-24">
        {open ? (
          <form action={action} className="card grid gap-4 border-accent">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="label">Pedido de apoio técnico</p>
                <h2 className="text-lg font-bold">{invited ? `Convidar ${invited.name}` : "Publicar demanda para toda a rede"}</h2>
                <p className="text-sm text-muted">O briefing foi montado a partir do seu diagnóstico. Ajuste o que quiser antes de enviar.</p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancelar</button>
            </div>
            <input type="hidden" name="invitedId" value={invited?.id ?? ""} />
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px_140px]">
              <div>
                <label className="field-label" htmlFor="rq-title">Título</label>
                <input id="rq-title" name="title" className="input" defaultValue={defaults.title} />
                {err("title")}
              </div>
              <div>
                <label className="field-label" htmlFor="rq-cat">Área do problema</label>
                <select id="rq-cat" name="category" className="input" defaultValue={defaults.category}>
                  {Object.entries(CATEGORIES).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="rq-hours">Horas estimadas</label>
                <input id="rq-hours" name="estimatedHours" type="number" min={2} max={200} className="input" defaultValue={12} />
                {err("estimatedHours")}
              </div>
            </div>
            <div>
              <label className="field-label" htmlFor="rq-brief">Briefing</label>
              <textarea id="rq-brief" name="briefing" rows={12} className="input font-mono text-xs leading-relaxed" defaultValue={defaults.briefing} />
              {err("briefing")}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <SubmitButton pendingText="Publicando…">{invited ? "Enviar convite" : "Publicar demanda"}</SubmitButton>
              {state?.message && <p className="text-sm text-bad">{state.message}</p>}
            </div>
          </form>
        ) : (
          <div className="card flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-xl text-sm text-muted">
              Publique uma demanda para todos os engenheiros da rede ou convide diretamente alguém da lista. Estudantes atuam com
              supervisão de mentores e contam as horas como extensão universitária.
            </p>
            <button type="button" className="btn btn-primary" onClick={() => start(null)}>Pedir apoio técnico</button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {engineers.map((e, i) => (
          <article key={e.id} className={`card grid content-start gap-3 ${i === 0 && e.score > 0 ? "border-accent shadow-sm" : ""}`}>
            {i === 0 && e.score > 0 && <p className="text-[11px] font-bold uppercase tracking-wider text-accent">Melhor match para sua maior perda</p>}
            <div className="flex items-start gap-3">
              <Avatar text={e.initials} tone={e.kind === "MENTOR" ? "ochre" : "ink"} />
              <div className="min-w-0">
                <p className="font-semibold">{e.name}</p>
                <p className="text-xs text-muted">{e.course}</p>
              </div>
            </div>
            <p className="text-sm text-muted">{e.bio}</p>
            <div className="flex flex-wrap gap-1">
              {e.skills.map((s) => <span key={s} className={`tag ${e.matchedSkills.includes(s) ? "tag-hit" : ""}`}>{s}</span>)}
            </div>
            <dl className="grid grid-cols-3 gap-2 text-xs">
              <div><dt className="text-muted">Perfil</dt><dd className="font-semibold">{e.kind === "MENTOR" ? "Mentor(a)" : "Estudante"}</dd></div>
              <div><dt className="text-muted">Disponível</dt><dd className="num">{e.hoursPerWeek} h/sem</dd></div>
              <div><dt className="text-muted">Avaliação</dt><dd className="num">{e.rating.toFixed(1)} / 5</dd></div>
            </dl>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted">{e.helpsWith ? `Pode ajudar com: ${e.helpsWith}` : "Sem relação direta com seus insumos"}</span>
              <button type="button" className={`btn btn-sm ${i === 0 && e.score > 0 ? "btn-primary" : ""}`} onClick={() => start(e)}>Convidar</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
