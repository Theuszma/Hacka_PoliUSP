"use client";

import { ArrowLeft, ArrowRight, Check, Plus, Trash2 } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { completeCompanyOnboarding, type ActionState } from "@/app/actions";
import { CATEGORIES, DESTINATIONS, type CategoryKey, type DestinationKey } from "@/lib/catalog";
import { CITIES } from "@/lib/cities";
import { money, pct, tons } from "@/lib/format";
import { totals } from "@/lib/metrics";
import { SECTORS, type SectorKey } from "@/lib/sectors";
import { SubmitButton } from "./forms";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { cn } from "./ui/cn";
import { Field, Input, Select, Textarea } from "./ui/form";

interface Row {
  key: string; name: string; category: CategoryKey; monthlyQty: string; unitCost: string; lossPct: string;
  destination: DestinationKey; destinationValue: string; leverText: string | null; leverReduction: number | null;
}
interface InputRow { category: CategoryKey; description: string; pricePaid: string; virginPrice: string; capacity: string; enabled: boolean }

const STEPS = ["Empresa", "Insumos", "Materiais que aceita", "Revisão"];
let k = 0;
const newKey = () => `r${++k}`;

function rowsFor(sector: SectorKey): Row[] {
  return SECTORS[sector].templates.map((t) => ({
    key: newKey(), name: t.name, category: t.category, monthlyQty: "", unitCost: String(t.unitCost), lossPct: String(Math.round(t.benchmarkLoss * 100)),
    destination: t.destination, destinationValue: String(t.destinationValue), leverText: t.leverText, leverReduction: t.leverReduction,
  }));
}

export function CompanyOnboarding({ defaultName }: { defaultName: string }) {
  const [state, action] = useActionState<ActionState, FormData>(completeCompanyOnboarding, null);
  const [step, setStep] = useState(0);
  const [company, setCompany] = useState({ name: "", cnpj: "", sector: "metalurgia" as SectorKey, size: "Pequena", employees: "", city: "São Bernardo do Campo", description: "" });
  const [rows, setRows] = useState<Row[]>(() => rowsFor("metalurgia"));
  const [inputs, setInputs] = useState<InputRow[]>([
    { category: "aco", description: "Retalhos de chapa", pricePaid: "3", virginPrice: "7.2", capacity: "1000", enabled: false },
    { category: "madeira", description: "Pallets usados em bom estado", pricePaid: "1", virginPrice: "2.8", capacity: "500", enabled: false },
    { category: "papelao", description: "Caixas de papelão reutilizáveis", pricePaid: "0.5", virginPrice: "4.5", capacity: "300", enabled: false },
  ]);
  const [stepError, setStepError] = useState<string | null>(null);

  const validRows = rows.filter((r) => r.name.trim() && Number(r.monthlyQty) > 0 && r.unitCost !== "");
  const flowsJson = validRows.map((r) => ({
    name: r.name.trim(), category: r.category, monthlyQty: Number(r.monthlyQty), unitCost: Number(r.unitCost), lossRate: Math.min(1, Number(r.lossPct) / 100),
    destination: r.destination, destinationValue: Number(r.destinationValue) || 0, leverText: r.leverText, leverReduction: r.leverReduction,
  }));
  const inputsJson = inputs.filter((i) => i.enabled).map((i) => ({ category: i.category, description: i.description, pricePaid: Number(i.pricePaid), virginPrice: Number(i.virginPrice), capacity: Number(i.capacity) }));
  const preview = useMemo(() => totals(flowsJson.map((f, i) => ({ ...f, id: String(i), unit: CATEGORIES[f.category].unit }))), [flowsJson]);

  const setSector = (s: SectorKey) => { setCompany((c) => ({ ...c, sector: s })); setRows(rowsFor(s)); };
  const update = (key: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const next = () => {
    setStepError(null);
    if (step === 0 && (!company.name.trim() || !(Number(company.employees) > 0))) return setStepError("Preencha o nome da empresa e o número de funcionários.");
    if (step === 1 && validRows.length === 0) return setStepError("Informe o consumo mensal de pelo menos um insumo.");
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-[13px] text-muted-foreground">Olá, {defaultName.split(" ")[0]}. Vamos configurar sua fábrica.</p>
        <h1 className="mt-1 text-2xl font-semibold">{["Conte sobre a empresa", "O que a fábrica compra", "O que você aceita receber", "Seu primeiro diagnóstico"][step]}</h1>
      </div>

      <ol className="flex items-center gap-2" aria-label="Etapas">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2">
            <span className={cn("grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold", i < step ? "bg-brand text-brand-foreground" : i === step ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>
              {i < step ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span className={cn("hidden text-[13px] sm:inline", i === step ? "font-medium" : "text-muted-foreground")}>{s}</span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
          </li>
        ))}
      </ol>

      <form action={action}>
        {Object.entries(company).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        <input type="hidden" name="flows" value={JSON.stringify(flowsJson)} />
        <input type="hidden" name="inputs" value={JSON.stringify(inputsJson)} />

        <Card className="p-6">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome da empresa" htmlFor="ob-name" className="sm:col-span-2"><Input id="ob-name" value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} placeholder="Ex.: Metalúrgica São Jorge" /></Field>
              <Field label="CNPJ (opcional)" htmlFor="ob-cnpj" error={state?.errors?.cnpj}><Input id="ob-cnpj" inputMode="numeric" value={company.cnpj} onChange={(e) => setCompany({ ...company, cnpj: e.target.value })} placeholder="00.000.000/0000-00" /></Field>
              <Field label="Setor" htmlFor="ob-sector" hint="Usamos o setor para sugerir insumos e comparar sua perda com a média.">
                <Select id="ob-sector" value={company.sector} onChange={(e) => setSector(e.target.value as SectorKey)}>
                  {Object.entries(SECTORS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                </Select>
              </Field>
              <Field label="Porte" htmlFor="ob-size">
                <Select id="ob-size" value={company.size} onChange={(e) => setCompany({ ...company, size: e.target.value })}>
                  <option value="Micro">Microempresa</option><option value="Pequena">Pequena empresa</option><option value="Média">Média empresa</option>
                </Select>
              </Field>
              <Field label="Funcionários" htmlFor="ob-emp"><Input id="ob-emp" type="number" min={1} value={company.employees} onChange={(e) => setCompany({ ...company, employees: e.target.value })} /></Field>
              <Field label="Cidade" htmlFor="ob-city" hint="Define quais parceiros estão perto o bastante para trocar resíduos." className="sm:col-span-2">
                <Select id="ob-city" value={company.city} onChange={(e) => setCompany({ ...company, city: e.target.value })}>
                  {CITIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                </Select>
              </Field>
              <Field label="O que a empresa produz (opcional)" htmlFor="ob-desc" className="sm:col-span-2"><Textarea id="ob-desc" rows={2} value={company.description} onChange={(e) => setCompany({ ...company, description: e.target.value })} placeholder="Ex.: peças estampadas e pintadas para linha branca" /></Field>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4">
              <p className="text-[13px] text-muted-foreground">
                Sugerimos os insumos mais comuns em <b className="text-foreground">{SECTORS[company.sector].label.toLowerCase()}</b>, com a perda média do setor. Ajuste para a sua realidade, preencha o consumo mensal e remova o que não usa.
              </p>
              <div className="grid gap-3">
                {rows.map((r) => (
                  <div key={r.key} className="grid grid-cols-2 gap-3 rounded-lg border p-3 sm:grid-cols-12 sm:items-end">
                    <Field label="Material" htmlFor={`n-${r.key}`} className="col-span-2 sm:col-span-6"><Input id={`n-${r.key}`} value={r.name} onChange={(e) => update(r.key, { name: e.target.value })} /></Field>
                    <Field label="Destino do resíduo" htmlFor={`d-${r.key}`} className="col-span-2 sm:col-span-5">
                      <Select id={`d-${r.key}`} value={r.destination} onChange={(e) => update(r.key, { destination: e.target.value as DestinationKey })}>
                        {Object.entries(DESTINATIONS).filter(([k]) => k !== "simbiose").map(([k, d]) => <option key={k} value={k}>{d.label}</option>)}
                      </Select>
                    </Field>
                    <div className="col-span-2 flex justify-end sm:col-span-1 sm:order-none">
                      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remover ${r.name}`} onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}><Trash2 /></Button>
                    </div>
                    <Field label={`Consumo por mês (${CATEGORIES[r.category].unit})`} htmlFor={`q-${r.key}`} className="col-span-2 sm:col-span-4"><Input id={`q-${r.key}`} type="number" min={0} inputMode="decimal" value={r.monthlyQty} onChange={(e) => update(r.key, { monthlyQty: e.target.value })} placeholder="0" /></Field>
                    <Field label={`R$ por ${CATEGORIES[r.category].unit}`} htmlFor={`c-${r.key}`} className="sm:col-span-4"><Input id={`c-${r.key}`} type="number" min={0} step="any" value={r.unitCost} onChange={(e) => update(r.key, { unitCost: e.target.value })} /></Field>
                    <Field label="Perda (%)" htmlFor={`l-${r.key}`} className="sm:col-span-4"><Input id={`l-${r.key}`} type="number" min={0} max={100} value={r.lossPct} onChange={(e) => update(r.key, { lossPct: e.target.value })} /></Field>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setRows((rs) => [...rs, { key: newKey(), name: "", category: "aco", monthlyQty: "", unitCost: "", lossPct: "10", destination: "aterro", destinationValue: "0", leverText: null, leverReduction: null }])}>
                  <Plus />Adicionar insumo
                </Button>
                <span className="self-center text-xs text-muted-foreground">Você pode importar uma planilha depois, em Insumos e resíduos.</span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4">
              <p className="text-[13px] text-muted-foreground">Resíduos de outras indústrias podem virar insumo para você, mais baratos que o material novo. Marque o que faz sentido. Isso é opcional e pode ser feito depois.</p>
              {inputs.map((i, idx) => (
                <label key={idx} className={cn("grid cursor-pointer gap-3 rounded-lg border p-3 transition sm:grid-cols-[auto_minmax(0,1fr)_120px_120px] sm:items-center", i.enabled && "border-foreground bg-subtle")}>
                  <input type="checkbox" className="size-4 accent-[hsl(var(--brand))]" checked={i.enabled} onChange={(e) => setInputs((xs) => xs.map((x, j) => (j === idx ? { ...x, enabled: e.target.checked } : x)))} />
                  <span><span className="block text-[13px] font-medium">{i.description}</span><span className="text-xs text-muted-foreground">{CATEGORIES[i.category].label}</span></span>
                  <span className="text-xs text-muted-foreground">Pagaria até<br /><b className="tabular text-foreground">{money(Number(i.pricePaid))}/{CATEGORIES[i.category].unit}</b></span>
                  <span className="text-xs text-muted-foreground">Até<br /><b className="tabular text-foreground">{Number(i.capacity).toLocaleString("pt-BR")} {CATEGORIES[i.category].unit}/mês</b></span>
                </label>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-5">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ["Prejuízo com resíduos", `${money(preview.loss)}/mês`, `${money(preview.loss * 12)} por ano`],
                  ["Taxa de desperdício", pct(preview.wasteRate, 1), "do valor comprado"],
                  ["CO₂e no material perdido", `${tons(preview.embodiedCo2)}/mês`, `circularidade de ${pct(preview.circularity)}`],
                ].map(([l, v, h]) => (
                  <div key={l} className="rounded-lg border bg-subtle p-4">
                    <p className="text-xs text-muted-foreground">{l}</p>
                    <p className="tabular mt-1 text-xl font-semibold">{v}</p>
                    <p className="text-xs text-muted-foreground">{h}</p>
                  </div>
                ))}
              </div>
              <p className="text-[13px] text-muted-foreground">
                {validRows.length} insumos e {inputsJson.length} materiais aceitos. Ao concluir, o Elo procura parceiros perto de {company.city} e recomenda engenheiros para as maiores perdas.
              </p>
            </div>
          )}

          {(stepError || state?.message) && <p className="mt-4 rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger">{stepError ?? state?.message}</p>}
        </Card>

        <div className="mt-4 flex items-center justify-between">
          <Button type="button" variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}><ArrowLeft />Voltar</Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={next}>Continuar<ArrowRight /></Button>
          ) : (
            <SubmitButton variant="brand" pendingText="Gerando diagnóstico…">Concluir e ver diagnóstico<ArrowRight /></SubmitButton>
          )}
        </div>
      </form>
    </div>
  );
}
