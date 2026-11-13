"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveFlow, type ActionState } from "@/app/actions";
import { CATEGORIES, DESTINATIONS } from "@/lib/catalog";
import { SubmitButton } from "./client";

export interface FlowFormValues {
  id?: string;
  name: string;
  category: string;
  monthlyQty: number | "";
  unitCost: number | "";
  lossRate: number | ""; // em %
  destination: string;
  destinationValue: number | "";
  supplier: string;
  lot: string;
}

const empty: FlowFormValues = { name: "", category: "aco", monthlyQty: "", unitCost: "", lossRate: "", destination: "aterro", destinationValue: 0, supplier: "", lot: "" };

export function FlowForm({ initial, onSaved }: { initial?: FlowFormValues; onSaved?: () => void }) {
  const [state, action] = useActionState<ActionState, FormData>(saveFlow, null);
  const [cat, setCat] = useState(initial?.category ?? empty.category);
  const formRef = useRef<HTMLFormElement>(null);
  const v = initial ?? empty;
  const unit = CATEGORIES[cat as keyof typeof CATEGORIES]?.unit ?? "kg";

  useEffect(() => {
    if (state?.ok) {
      if (!initial) formRef.current?.reset();
      onSaved?.();
    }
  }, [state, initial, onSaved]);

  const err = (k: string) => state?.errors?.[k] && <p className="field-error">{state.errors[k]}</p>;

  return (
    <form ref={formRef} action={action} className="grid gap-4" noValidate>
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="ff-name">Material</label>
          <input id="ff-name" name="name" className="input" defaultValue={v.name} placeholder="Ex.: Bobina de alumínio 1050" required />
          {err("name")}
        </div>
        <div>
          <label className="field-label" htmlFor="ff-cat">Tipo</label>
          <select id="ff-cat" name="category" className="input" value={cat} onChange={(e) => setCat(e.target.value)}>
            {Object.entries(CATEGORIES).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="ff-qty">Consumo por mês ({unit})</label>
          <input id="ff-qty" name="monthlyQty" type="number" min="0" step="any" inputMode="decimal" className="input" defaultValue={v.monthlyQty} placeholder="2000" />
          {err("monthlyQty")}
        </div>
        <div>
          <label className="field-label" htmlFor="ff-cost">Custo por {unit} (R$)</label>
          <input id="ff-cost" name="unitCost" type="number" min="0" step="any" inputMode="decimal" className="input" defaultValue={v.unitCost} placeholder="24,00" />
          {err("unitCost")}
        </div>
        <div>
          <label className="field-label" htmlFor="ff-loss">Perda (%)</label>
          <input id="ff-loss" name="lossRate" type="number" min="0" max="100" step="any" inputMode="decimal" className="input" defaultValue={v.lossRate} placeholder="12" />
          {err("lossRate")}
        </div>
        <div>
          <label className="field-label" htmlFor="ff-dest">Destino do resíduo</label>
          <select id="ff-dest" name="destination" className="input" defaultValue={v.destination}>
            {Object.entries(DESTINATIONS).map(([k, d]) => <option key={k} value={k}>{d.label}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="ff-dv">Recebe (+) ou paga (−) por {unit}</label>
          <input id="ff-dv" name="destinationValue" type="number" step="any" inputMode="decimal" className="input" defaultValue={v.destinationValue} />
          {err("destinationValue")}
        </div>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="ff-sup">Fornecedor (opcional)</label>
          <input id="ff-sup" name="supplier" className="input" defaultValue={v.supplier} />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="ff-lot">Lote atual (opcional)</label>
          <input id="ff-lot" name="lot" className="input" defaultValue={v.lot} />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton>{v.id ? "Salvar alterações" : "Adicionar ao diagnóstico"}</SubmitButton>
        {state?.message && <p role="status" className={`text-sm ${state.ok ? "text-good" : "text-bad"}`}>{state.message}</p>}
      </div>
    </form>
  );
}
