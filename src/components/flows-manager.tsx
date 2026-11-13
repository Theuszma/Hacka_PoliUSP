"use client";

import { Download, FileSpreadsheet, MoreHorizontal, Pencil, Plus, Trash2, Upload } from "lucide-react";
import Papa from "papaparse";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteFlow, importFlows, saveFlow, type ActionState } from "@/app/actions";
import { CATEGORIES, CATEGORY_KEYS, DESTINATIONS, DESTINATION_KEYS } from "@/lib/catalog";
import { num, pct } from "@/lib/format";
import { SubmitButton } from "./forms";
import { Button } from "./ui/button";
import { Field, Input, Select } from "./ui/form";
import { Dialog, DialogClose, DialogContent, DialogTrigger, Menu, MenuContent, MenuItem, MenuTrigger } from "./ui/overlay";

export interface FlowRow {
  id: string; name: string; category: string; unit: string; monthlyQty: number; unitCost: number; lossRate: number;
  destination: string; destinationValue: number; supplier: string | null; lot: string | null;
}

function FlowForm({ flow, onSaved }: { flow?: FlowRow; onSaved: () => void }) {
  const [state, action] = useActionState<ActionState, FormData>(saveFlow, null);
  const [cat, setCat] = useState(flow?.category ?? "aco");
  const e = state?.errors ?? {};
  const unit = CATEGORIES[cat as keyof typeof CATEGORIES]?.unit ?? "kg";
  useEffect(() => {
    if (state?.ok) { toast.success(state.message ?? "Salvo"); onSaved(); }
    else if (state?.message) toast.error(state.message);
  }, [state, onSaved]);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {flow && <input type="hidden" name="id" value={flow.id} />}
      <Field label="Nome do insumo" htmlFor="f-name" error={e.name} className="sm:col-span-2"><Input id="f-name" name="name" defaultValue={flow?.name} placeholder="Ex.: Chapa de aço SAE 1020" autoFocus /></Field>
      <Field label="Categoria" htmlFor="f-cat" error={e.category}>
        <Select id="f-cat" name="category" value={cat} onChange={(ev) => setCat(ev.target.value)}>
          {CATEGORY_KEYS.map((k) => <option key={k} value={k}>{CATEGORIES[k].label}</option>)}
        </Select>
      </Field>
      <Field label={`Consumo por mês (${unit})`} htmlFor="f-qty" error={e.monthlyQty}><Input id="f-qty" name="monthlyQty" type="number" step="any" min={0} defaultValue={flow?.monthlyQty} /></Field>
      <Field label={`Custo por ${unit} (R$)`} htmlFor="f-cost" error={e.unitCost}><Input id="f-cost" name="unitCost" type="number" step="any" min={0} defaultValue={flow?.unitCost} /></Field>
      <Field label="Perda (%)" htmlFor="f-loss" error={e.lossRate} hint="Parte do que é comprado que vira resíduo"><Input id="f-loss" name="lossRate" type="number" step="any" min={0} max={100} defaultValue={flow ? +(flow.lossRate * 100).toFixed(1) : undefined} /></Field>
      <Field label="Destino do resíduo" htmlFor="f-dest" error={e.destination}>
        <Select id="f-dest" name="destination" defaultValue={flow?.destination ?? "aterro"}>
          {DESTINATION_KEYS.map((k) => <option key={k} value={k}>{DESTINATIONS[k].label}</option>)}
        </Select>
      </Field>
      <Field label={`Valor do destino (R$/${unit})`} htmlFor="f-dv" error={e.destinationValue} hint="Positivo se vende, negativo se paga para descartar"><Input id="f-dv" name="destinationValue" type="number" step="any" defaultValue={flow?.destinationValue ?? 0} /></Field>
      <Field label="Fornecedor (opcional)" htmlFor="f-sup"><Input id="f-sup" name="supplier" defaultValue={flow?.supplier ?? ""} /></Field>
      <Field label="Lote (opcional)" htmlFor="f-lot"><Input id="f-lot" name="lot" defaultValue={flow?.lot ?? ""} /></Field>
      <div className="flex justify-end gap-2 sm:col-span-2">
        <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
        <SubmitButton pendingText="Salvando…">{flow ? "Salvar alterações" : "Adicionar insumo"}</SubmitButton>
      </div>
    </form>
  );
}

export function FlowDialog({ flow, trigger }: { flow?: FlowRow; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent wide title={flow ? `Editar ${flow.name}` : "Novo insumo"} description="Os valores são mensais. Cada alteração entra no histórico do mês atual.">
        {open && <FlowForm flow={flow} onSaved={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

export function AddFlowButton() {
  return <FlowDialog trigger={<Button size="sm"><Plus />Novo insumo</Button>} />;
}

export function FlowActions({ flow }: { flow: FlowRow }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <>
      <Menu>
        <MenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Ações de ${flow.name}`} disabled={pending}><MoreHorizontal /></Button></MenuTrigger>
        <MenuContent>
          <MenuItem onSelect={() => setEditing(true)}><Pencil />Editar</MenuItem>
          <MenuItem className="text-danger focus:text-danger" onSelect={() => start(async () => {
            const fd = new FormData(); fd.set("id", flow.id);
            await deleteFlow(fd); toast.success(`${flow.name} removido`); router.refresh();
          })}><Trash2 />Remover</MenuItem>
        </MenuContent>
      </Menu>
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent wide title={`Editar ${flow.name}`} description="Os valores são mensais. Cada alteração entra no histórico do mês atual.">
          {editing && <FlowForm flow={flow} onSaved={() => setEditing(false)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ---------------- Importação de planilha ---------------- */

const COLUMNS = ["nome", "categoria", "consumo_mensal", "custo_unitario", "perda_percentual", "destino", "valor_destino"];
const TEMPLATE = `${COLUMNS.join(",")}\nChapa de aço SAE 1020,aco,12000,7.2,18,sucata,1.1\nFluido de corte,fluido,400,18,25,classe1,-2.5\nPallets de madeira,madeira,900,2.8,10,aterro,-0.2\n`;

const CAT_ALIASES: Record<string, string> = Object.fromEntries(CATEGORY_KEYS.flatMap((k) => [[k, k], [CATEGORIES[k].label.toLowerCase(), k]]));
const DEST_ALIASES: Record<string, string> = Object.fromEntries(DESTINATION_KEYS.flatMap((k) => [[k, k], [DESTINATIONS[k].label.toLowerCase(), k]]));
const toNum = (v: unknown) => Number(String(v ?? "").trim().replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));

interface Parsed { ok: boolean; row: Record<string, unknown>; error?: string }

function parseRows(data: Record<string, string>[]): Parsed[] {
  return data.filter((r) => Object.values(r).some((v) => String(v).trim())).map((r) => {
    const row = {
      name: String(r.nome ?? "").trim(),
      category: CAT_ALIASES[String(r.categoria ?? "").trim().toLowerCase()],
      monthlyQty: toNum(r.consumo_mensal),
      unitCost: toNum(r.custo_unitario),
      lossRate: toNum(r.perda_percentual) / 100,
      destination: DEST_ALIASES[String(r.destino ?? "aterro").trim().toLowerCase() || "aterro"],
      destinationValue: toNum(r.valor_destino || 0),
    };
    const error = !row.name ? "sem nome" : !row.category ? "categoria desconhecida" : !(row.monthlyQty > 0) ? "consumo inválido" : !(row.unitCost >= 0) ? "custo inválido"
      : !(row.lossRate >= 0 && row.lossRate <= 1) ? "perda fora de 0–100" : !row.destination ? "destino desconhecido" : !Number.isFinite(row.destinationValue) ? "valor do destino inválido" : undefined;
    return { ok: !error, row, error };
  });
}

export function ImportDialog() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Parsed[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);

  const onFile = (file: File) => {
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true, skipEmptyLines: true, transformHeader: (h) => h.trim().toLowerCase(),
      complete: (res) => setRows(parseRows(res.data)),
      error: () => toast.error("Não foi possível ler o arquivo"),
    });
  };
  const valid = rows?.filter((r) => r.ok) ?? [];
  const download = () => {
    const url = URL.createObjectURL(new Blob([TEMPLATE], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "modelo-insumos-elo.csv"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setRows(null); setFileName(""); } }}>
      <DialogTrigger asChild><Button variant="outline" size="sm"><Upload />Importar planilha</Button></DialogTrigger>
      <DialogContent wide title="Importar insumos de uma planilha" description="Exporte do seu ERP ou planilha de compras em CSV. Cada linha vira um insumo no diagnóstico.">
        {!rows ? (
          <div className="grid gap-4">
            <button type="button" onClick={() => input.current?.click()}
              onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
              className="grid place-items-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center transition hover:bg-subtle">
              <FileSpreadsheet className="size-8 text-muted-foreground" />
              <span className="text-[13.5px] font-medium">Arraste o arquivo CSV ou clique para escolher</span>
              <span className="text-xs text-muted-foreground">Colunas: {COLUMNS.join(", ")}</span>
            </button>
            <input ref={input} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
            <Button type="button" variant="link" className="justify-self-start px-0" onClick={download}><Download />Baixar planilha modelo</Button>
          </div>
        ) : (
          <div className="grid gap-4">
            <p className="text-[13px] text-muted-foreground"><b className="text-foreground">{fileName}</b>: {valid.length} de {rows.length} linhas prontas para importar.</p>
            <div className="max-h-72 overflow-auto rounded-lg border">
              <table className="w-full text-[13px]">
                <thead className="sticky top-0 bg-subtle text-left text-xs text-muted-foreground"><tr><th className="px-3 py-2 font-medium">Insumo</th><th className="px-3 py-2 font-medium">Consumo</th><th className="px-3 py-2 font-medium">Perda</th><th className="px-3 py-2 font-medium">Status</th></tr></thead>
                <tbody className="divide-y">
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">{String(r.row.name) || "—"}</td>
                      <td className="tabular px-3 py-2">{Number.isFinite(r.row.monthlyQty) ? num(r.row.monthlyQty as number) : "—"}</td>
                      <td className="tabular px-3 py-2">{Number.isFinite(r.row.lossRate) ? pct(r.row.lossRate as number, 1) : "—"}</td>
                      <td className="px-3 py-2">{r.ok ? <span className="text-success">pronto</span> : <span className="text-danger">{r.error}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setRows(null)}>Escolher outro arquivo</Button>
              <Button type="button" disabled={!valid.length || pending} onClick={() => start(async () => {
                const res = await importFlows(valid.map((r) => r.row));
                if (res?.ok) { toast.success(res.message); setOpen(false); setRows(null); router.refresh(); } else toast.error(res?.message ?? "Falha ao importar");
              })}>{pending ? "Importando…" : `Importar ${valid.length} insumos`}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

