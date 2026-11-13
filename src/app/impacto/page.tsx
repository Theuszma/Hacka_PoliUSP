import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { category } from "@/lib/catalog";
import { networkMatches } from "@/lib/data";
import { money, num, pct, tons } from "@/lib/format";
import { totals } from "@/lib/metrics";
import { RoleShell } from "@/components/shells";
import { Kpi, PageHeader, Section } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Impacto da rede" };

const ODS = [
  { n: 9, color: "#FD6925", title: "Indústria, inovação e infraestrutura", meta: "Meta 9.4", text: "Modernizar a indústria com uso mais eficiente de recursos e tecnologias limpas." },
  { n: 12, color: "#BF8B2E", title: "Consumo e produção responsáveis", meta: "Metas 12.2 e 12.5", text: "Uso eficiente de recursos e redução da geração de resíduos por reuso e reciclagem." },
  { n: 13, color: "#3F7E44", title: "Ação contra a mudança do clima", meta: "Meta 13.2", text: "Emissões evitadas ao substituir matéria-prima virgem." },
  { n: 4, color: "#C5192D", title: "Educação de qualidade", meta: "Meta 4.4", text: "Estudantes de engenharia aplicando conhecimento técnico em problemas reais." },
];

export default async function ImpactPage() {
  const user = await currentUser();
  const [companies, engineers, exchanges, requests, matches] = await Promise.all([
    db.company.findMany({ include: { flows: true } }),
    db.engineer.findMany(),
    db.exchange.findMany({ where: { status: "ACCEPTED" }, include: { flow: true, demand: true } }),
    db.supportRequest.findMany(),
    networkMatches(),
  ]);

  const diverted = exchanges.reduce((s, e) => s + e.quantity * category(e.flow.category).kgPerUnit, 0) * 12;
  const exchangeValue = exchanges.reduce((s, e) => s + (e.demand.virginPrice - e.price) * e.quantity + Math.max(0, e.price) * e.quantity, 0) * 12;
  const exchangeCo2 = exchanges.reduce((s, e) => s + e.quantity * category(e.flow.category).co2Factor * e.demand.substitution, 0) * 12;
  const done = requests.filter((r) => r.status === "DONE");
  const engSaved = done.reduce((s, r) => s + (r.savedPerMonth ?? 0), 0) * 12;
  const hours = requests.filter((r) => r.status !== "OPEN").reduce((s, r) => s + r.estimatedHours, 0);
  const potential = matches.filter((m) => !exchanges.some((e) => e.flowId === m.flow.id && e.demandId === m.demand.id));
  const potentialValue = potential.reduce((s, m) => s + m.senderGain + m.receiverSaving, 0) * 12;

  const rows = companies
    .filter((c) => c.flows.length)
    .map((c) => ({ c, t: totals(c.flows) }))
    .sort((a, b) => b.t.loss - a.t.loss);
  const network = totals(companies.flatMap((c) => c.flows));

  const body = (
    <div className="grid gap-6">
      <PageHeader eyebrow="Rede Elo · piloto ABC Paulista" title="Impacto da rede">
        Números calculados a partir dos dados cadastrados na plataforma, ligados às metas da Agenda 2030.
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Na rede" value={companies.length} unit="empresas" hint={`${engineers.filter((e) => e.kind === "STUDENT").length} estudantes e ${engineers.filter((e) => e.kind === "MENTOR").length} mentores`} />
        <Kpi tone="good" label="Desviado do aterro" value={tons(diverted, 0)} unit="/ano" hint={`em ${exchanges.length} trocas de resíduo ativas`} />
        <Kpi label="Valor gerado" value={money(exchangeValue + engSaved)} unit="/ano" hint="trocas de resíduo e melhorias concluídas" />
        <Kpi label="CO₂e evitado" value={tons(exchangeCo2, 0)} unit="/ano" hint={`${hours} h de engenharia aplicadas`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Section title="Onde está o desperdício" aside={`${money(network.loss * 12)}/ano na rede · circularidade de ${pct(network.circularity)}`}>
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="table min-w-[520px]">
              <thead><tr><th>Empresa</th><th className="text-right">Prejuízo/ano</th><th className="text-right">Desperdício</th><th className="text-right">Circularidade</th></tr></thead>
              <tbody>
                {rows.map(({ c, t }) => (
                  <tr key={c.id}>
                    <td><p className="font-medium">{c.name}</p><p className="text-xs text-muted">{c.city}</p></td>
                    <td className="num text-right">{money(t.loss * 12)}</td>
                    <td className="num text-right">{pct(t.wasteRate, 1)}</td>
                    <td className="text-right">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-sunken"><span className="block h-full bg-good" style={{ width: `${t.circularity * 100}%` }} /></span>
                        <span className="num w-10 text-right">{pct(t.circularity)}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
        <section className="card grid content-start gap-3">
          <p className="label">Ainda na mesa</p>
          <p className="font-display text-3xl font-extrabold text-accent">{money(potentialValue)}<span className="ml-1 font-sans text-sm font-medium text-muted">/ano</span></p>
          <p className="text-sm text-muted">em {potential.length} trocas de resíduo compatíveis que o matching encontrou e ainda não foram fechadas.</p>
          <p className="text-sm text-muted">{requests.filter((r) => r.status === "OPEN").length} demandas esperam engenheiro e {num(requests.filter((r) => r.status === "IN_PROGRESS").length)} estão em andamento.</p>
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {ODS.map((o) => (
          <div key={o.n} className="card flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg font-display text-lg font-extrabold text-white" style={{ background: o.color }}>{o.n}</span>
            <div>
              <p className="font-semibold">ODS {o.n} · {o.title}</p>
              <p className="text-xs text-muted">{o.meta}</p>
              <p className="mt-1 text-sm">{o.text}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted">Protótipo com dados fictícios. Fatores de emissão aproximados para fins de demonstração.</p>
    </div>
  );

  if (user) return <RoleShell user={user}>{body}</RoleShell>;
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link href="/entrar" className="mb-6 inline-block text-sm font-semibold text-accent">Entrar na plataforma →</Link>
      {body}
    </main>
  );
}
