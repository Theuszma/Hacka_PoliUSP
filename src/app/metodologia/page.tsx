import { currentUser, homeFor } from "@/lib/auth";
import { CATEGORIES } from "@/lib/catalog";
import { FREIGHT_CO2_PER_TKM, MATERIAL_FACTORS } from "@/lib/engine/factors";
import { METHODS, type MethodKey } from "@/lib/engine/methods";
import { SOURCES } from "@/lib/engine/sources";
import { AppShell, PageHeader } from "@/components/shell";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { MethodBody } from "@/components/how";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export const dynamic = "force-dynamic";
export const metadata = { title: "Como calculamos" };

const n3 = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 3 });

function Content() {
  const keys = Object.keys(METHODS) as MethodKey[];
  return (
    <>
      <PageHeader eyebrow="Metodologia" title="Como calculamos" description="Cada número do Elo vem de uma fórmula aberta, com fonte e premissas declaradas. O motor recalcula tudo a cada alteração de insumo, troca ou demanda." />
      <div className="grid gap-4">
        {keys.map((k) => (
          <Card key={k} id={k} className="scroll-mt-20">
            <CardHeader title={METHODS[k].title} description={METHODS[k].explanation} />
            <CardBody className="pt-0"><MethodBody method={k} /></CardBody>
          </Card>
        ))}

        <Card id="fatores" className="scroll-mt-20">
          <CardHeader title="Fatores de emissão por material" description="kg CO₂e por kg · DESNZ/DEFRA, conversion factors 2024 (conjunto condensado v1.1), abas Material use e Waste disposal" />
          <div className="overflow-x-auto border-t">
            <Table>
              <THead><TR><TH>Material</TH><TH className="text-right">Primário</TH><TH className="text-right">Reciclado</TH><TH className="text-right">Aterro</TH><TH>Linha da tabela</TH></TR></THead>
              <TBody>
                {Object.entries(MATERIAL_FACTORS).map(([k, f]) => (
                  <TR key={k}>
                    <TD className="whitespace-nowrap font-medium">{CATEGORIES[k as keyof typeof CATEGORIES]?.label ?? k}</TD>
                    <TD className="tabular text-right">{n3(f.primary)}</TD>
                    <TD className="tabular text-right">{f.recycled === null ? "—" : n3(f.recycled)}</TD>
                    <TD className="tabular text-right">{n3(f.landfill)}</TD>
                    <TD className="min-w-[260px] text-xs text-muted-foreground">{f.estimate && <Badge tone="warning" className="mr-1">estimativa</Badge>}{f.reference}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
          <p className="border-t px-5 py-3 text-xs text-muted-foreground">Frete: {FREIGHT_CO2_PER_TKM.toLocaleString("pt-BR", { maximumFractionDigits: 5 })} kg CO₂e por tonelada·km (HGV a diesel, todas as categorias, carga média).</p>
        </Card>

        <Card id="fontes" className="scroll-mt-20">
          <CardHeader title="Referências" description="Lista em ABNT, com o que cada fonte alimenta, em docs/REFERENCIAS.md no repositório" />
          <ol className="grid gap-2 px-5 pb-5 text-[13px] text-muted-foreground">
            {Object.values(SOURCES).map((s) => (
              <li key={s.id}>{"url" in s ? <a href={s.url} target="_blank" rel="noreferrer" className="hover:text-foreground hover:underline">{s.citation}</a> : s.citation}</li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}

export default async function MethodologyPage() {
  const user = await currentUser();
  const ready = user && (user.role === "COMPANY" ? !!user.company?.onboardedAt : !!user.engineer);
  if (user && ready) return <AppShell user={user}><Content /></AppShell>;
  return (
    <div className="min-h-dvh">
      <PublicHeader loggedHref={user ? homeFor(user) : null} />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6"><Content /></main>
      <PublicFooter />
    </div>
  );
}
