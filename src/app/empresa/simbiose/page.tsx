import { requireCompanyUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { companyExchanges, networkMatches } from "@/lib/data";
import { category } from "@/lib/catalog";
import { money, money2, num, signedMoney2, tons } from "@/lib/format";
import type { SymbiosisMatch } from "@/lib/matching";
import { proposeExchange, respondExchange } from "@/app/actions";
import { NetworkMap, type MapNode } from "@/components/charts";
import { SubmitButton } from "@/components/client";
import { Arrow, Empty, ExchangeStatus, PageHeader, Pill, Section } from "@/components/ui";

export const metadata = { title: "Simbiose industrial" };

export default async function SymbiosisPage() {
  const user = await requireCompanyUser();
  const me = user.company;
  const [matches, exchanges, companies] = await Promise.all([networkMatches(), companyExchanges(me.id), db.company.findMany()]);

  const outgoing = matches.filter((m) => m.flow.companyId === me.id);
  const incoming = matches.filter((m) => m.demand.companyId === me.id);
  const exchangeFor = (m: SymbiosisMatch) => exchanges.find((e) => e.flowId === m.flow.id && e.demandId === m.demand.id && e.status !== "DECLINED");
  const toAnswer = exchanges.filter((e) => e.status === "PROPOSED" && e.initiatorId !== me.id);

  const nodes = new Map<string, MapNode>();
  for (const c of companies) if (c.id !== me.id) nodes.set(c.id, { id: c.id, name: c.name, lat: c.lat, lng: c.lng, kind: "other" });
  for (const m of outgoing) nodes.set(m.demand.companyId, { ...nodes.get(m.demand.companyId)!, kind: "out" });
  for (const m of incoming) nodes.set(m.flow.companyId, { ...nodes.get(m.flow.companyId)!, kind: "in" });
  for (const e of exchanges) if (e.status === "ACCEPTED") {
    const other = e.fromId === me.id ? e.toId : e.fromId;
    nodes.set(other, { ...nodes.get(other)!, kind: "active" });
  }

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Simbiose industrial" title="O resíduo de uma indústria é o insumo de outra">
        O Elo cruza o que cada empresa descarta com o que as outras compram, por material, volume, capacidade, licença ambiental e distância.
      </PageHeader>

      {toAnswer.length > 0 && (
        <Section title="Propostas esperando sua resposta" className="border-ochre">
          <ul className="grid gap-3">
            {toAnswer.map((e) => {
              const iSend = e.fromId === me.id;
              const other = iSend ? e.to : e.from;
              return (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-sunken p-3">
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold">{other.name} {iSend ? "quer receber" : "oferece"} {e.flow.name.toLowerCase()}</p>
                    <p className="text-muted">
                      {num(e.quantity)} {e.flow.unit}/mês a {money2(e.price)}/{e.flow.unit}
                      {!iSend && ` · material novo custaria ${money2(e.demand.virginPrice)}/${e.flow.unit}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <form action={respondExchange}><input type="hidden" name="id" value={e.id} /><input type="hidden" name="decision" value="decline" /><SubmitButton className="btn btn-sm" pendingText="…">Recusar</SubmitButton></form>
                    <form action={respondExchange}><input type="hidden" name="id" value={e.id} /><input type="hidden" name="decision" value="accept" /><SubmitButton className="btn btn-primary btn-sm" pendingText="…">Aceitar troca</SubmitButton></form>
                  </div>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Section title="Sua rede" aside={
          <span className="flex flex-wrap gap-3">
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-accent" />Quer seu resíduo</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-ochre" />Oferece insumo</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-good" />Troca ativa</span>
          </span>
        }>
          <NetworkMap center={{ lat: me.lat, lng: me.lng, label: me.initials }} nodes={[...nodes.values()]} />
        </Section>
        <section className="card grid content-start gap-3 text-sm">
          <p className="label">Como o match é feito</p>
          <ol className="grid list-decimal gap-2 pl-4">
            <li>O resíduo é classificado por tipo de material.</li>
            <li>O Elo busca empresas que compram esse material como insumo num raio de 40 km.</li>
            <li>O volume é limitado pela capacidade de quem recebe.</li>
            <li>Resíduo perigoso (Classe I) só vai para destinatário licenciado.</li>
            <li>O frete é descontado e a troca precisa gerar valor e reduzir CO₂e.</li>
          </ol>
        </section>
      </div>

      <div className="grid gap-3">
        <h2 className="text-lg font-bold">Empresas que querem seus resíduos</h2>
        {outgoing.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {outgoing.map((m) => <MatchCard key={m.flow.id + m.demand.id} m={m} direction="out" exchange={exchangeFor(m)} me={me.id} />)}
          </div>
        ) : (
          <Empty>Nenhuma empresa da rede compra seus resíduos ainda. Conforme a rede cresce, novos matches aparecem aqui.</Empty>
        )}
      </div>

      <div className="grid gap-3">
        <h2 className="text-lg font-bold">Resíduos de outras empresas que viram insumo para você</h2>
        {incoming.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {incoming.map((m) => <MatchCard key={m.flow.id + m.demand.id} m={m} direction="in" exchange={exchangeFor(m)} me={me.id} />)}
          </div>
        ) : (
          <Empty>Cadastre o que sua fábrica aceita receber como insumo para ver ofertas de outras empresas.</Empty>
        )}
      </div>

      <Section title="Histórico de trocas">
        {exchanges.length ? (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="table min-w-[640px]">
              <thead><tr><th>Material</th><th>De → para</th><th className="text-right">Volume</th><th className="text-right">Preço</th><th>Status</th></tr></thead>
              <tbody>
                {exchanges.map((e) => (
                  <tr key={e.id}>
                    <td className="font-medium">{e.flow.name}</td>
                    <td className="text-muted">{e.from.name} → {e.to.name}</td>
                    <td className="num text-right">{num(e.quantity)} {e.flow.unit}/mês</td>
                    <td className="num text-right">{money2(e.price)}</td>
                    <td><ExchangeStatus status={e.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>Nenhuma troca ainda.</Empty>
        )}
      </Section>
    </div>
  );
}

function MatchCard({ m, direction, exchange, me }: { m: SymbiosisMatch; direction: "out" | "in"; exchange?: { status: string; initiatorId: string }; me: string }) {
  const unit = m.flow.unit;
  const cat = category(m.flow.category);
  return (
    <article className="card grid content-start gap-3">
      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
        <span>{direction === "out" ? m.flow.name : m.flow.company.name}</span>
        <Arrow />
        <span>{direction === "out" ? m.demand.company.name : "sua fábrica"}</span>
      </div>
      {direction === "in" && <p className="text-sm font-semibold">{m.flow.name}</p>}
      <p className="text-sm text-muted">{direction === "out" ? m.demand.use : m.demand.description}</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div><dt className="text-muted">Volume</dt><dd className="num text-sm">{num(m.volume)} {unit}/mês</dd></div>
        <div><dt className="text-muted">Distância</dt><dd className="num text-sm">{num(m.distanceKm, 1)} km</dd></div>
        {direction === "out" ? (
          <>
            <div><dt className="text-muted">Hoje</dt><dd className="num text-sm">{signedMoney2(m.flow.destinationValue)}/{unit}</dd></div>
            <div><dt className="text-muted">Com a troca</dt><dd className="num text-sm">{signedMoney2(m.demand.pricePaid)}/{unit}</dd></div>
            <div><dt className="text-muted">Ganho líquido de frete</dt><dd className="num text-sm font-semibold text-good">{money(m.senderGain * 12)}/ano</dd></div>
          </>
        ) : (
          <>
            <div><dt className="text-muted">Preço</dt><dd className="num text-sm">{money2(m.demand.pricePaid)}/{unit}</dd></div>
            <div><dt className="text-muted">Material novo</dt><dd className="num text-sm">{money2(m.demand.virginPrice)}/{unit}</dd></div>
            <div><dt className="text-muted">Sua economia</dt><dd className="num text-sm font-semibold text-good">{money(m.receiverSaving * 12)}/ano</dd></div>
          </>
        )}
        <div><dt className="text-muted">CO₂e evitado</dt><dd className="num text-sm">{tons(m.co2Avoided * 12)}/ano</dd></div>
      </dl>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        {exchange ? (exchange.status === "PROPOSED" && exchange.initiatorId !== me ? <Pill tone="warn">Aguardando sua resposta</Pill> : <ExchangeStatus status={exchange.status} />) : cat.hazardous ? <Pill tone="warn">Destinatário licenciado</Pill> : <Pill tone="accent">Compatível</Pill>}
        {!exchange && (
          <form action={proposeExchange}>
            <input type="hidden" name="flowId" value={m.flow.id} />
            <input type="hidden" name="demandId" value={m.demand.id} />
            <SubmitButton className="btn btn-primary btn-sm" pendingText="Enviando…">{direction === "out" ? "Propor troca" : "Pedir o material"}</SubmitButton>
          </form>
        )}
      </div>
    </article>
  );
}
