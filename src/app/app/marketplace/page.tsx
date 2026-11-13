import { LOGISTICS } from "@/lib/catalog";
import { ArrowDownLeft, ArrowUpRight, Check, Handshake, PackageSearch, X } from "lucide-react";
import { requireCompanyUser } from "@/lib/auth";
import { category } from "@/lib/catalog";
import { companyExchanges, networkMatches } from "@/lib/data";
import { db } from "@/lib/db";
import { money, money2, num, relativeDate, tons } from "@/lib/format";
import { lowerFirst } from "@/lib/format";
import type { SymbiosisMatch } from "@/lib/matching";
import { proposeExchange, respondExchange } from "@/app/actions";
import { PageHeader } from "@/components/shell";
import { ExchangeStatusBadge, NetworkMap, type MapNode } from "@/components/domain";
import { ActionButton } from "@/components/forms";
import { AddDemandButton, DeleteDemandButton } from "@/components/marketplace-client";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { Avatar, EmptyState } from "@/components/ui/misc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/overlay";

export const metadata = { title: "Marketplace de resíduos" };

function MatchCard({ m, direction, status, me }: { m: SymbiosisMatch; direction: "out" | "in"; status?: { status: string; initiatorId: string }; me: string }) {
  const partner = direction === "out" ? m.demand.company : m.flow.company;
  const gain = direction === "out" ? m.senderGain : m.receiverSaving;
  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-start gap-3">
        <Avatar name={partner.name} square size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-medium">{partner.name}</p>
          <p className="text-xs text-muted-foreground">{num(m.distanceKm, 1)} km · {category(m.flow.category).label}</p>
        </div>
        <div className="text-right">
          <p className="tabular text-[15px] font-semibold text-success">+{money(gain)}</p>
          <p className="text-[11px] text-muted-foreground">por mês</p>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg bg-subtle p-3 text-xs">
        <dt className="text-muted-foreground">{direction === "out" ? "Seu resíduo" : "Resíduo deles"}</dt><dd className="truncate text-right font-medium">{m.flow.name}</dd>
        <dt className="text-muted-foreground">Volume</dt><dd className="tabular text-right">{num(m.volume)} {m.flow.unit}/mês</dd>
        <dt className="text-muted-foreground">Preço</dt><dd className="tabular text-right">{money2(m.demand.pricePaid)}/{m.flow.unit}</dd>
        <dt className="text-muted-foreground">{direction === "out" ? "Frete (descontado)" : "Uso"}</dt><dd className="truncate text-right">{direction === "out" ? money(m.freight) : m.demand.use}</dd>
        <dt className="text-muted-foreground">CO₂e evitado</dt><dd className="tabular text-right">{tons(m.co2Avoided)}/mês</dd>
      </dl>
      <div className="mt-3 flex items-center justify-between gap-2 pt-1">
        {status ? <ExchangeStatusBadge status={status.status} waitingMe={status.status === "PROPOSED" && status.initiatorId !== me} /> : <span className="text-xs text-muted-foreground">{m.demand.description}</span>}
        {!status && (
          <ActionButton size="sm" action={proposeExchange} fields={{ flowId: m.flow.id, demandId: m.demand.id }}>
            <Handshake />Propor troca
          </ActionButton>
        )}
      </div>
    </Card>
  );
}

export default async function MarketplacePage() {
  const user = await requireCompanyUser();
  const me = user.company.id;
  const [matches, exchanges, demands, companies] = await Promise.all([
    networkMatches(),
    companyExchanges(me),
    db.inputDemand.findMany({ where: { companyId: me }, orderBy: { createdAt: "desc" } }),
    db.company.findMany({ where: { onboardedAt: { not: null } }, select: { id: true, name: true, lat: true, lng: true } }),
  ]);
  const key = (flowId: string, demandId: string) => `${flowId}:${demandId}`;
  const exByKey = new Map(exchanges.filter((e) => e.status !== "DECLINED").map((e) => [key(e.flowId, e.demandId), e]));

  const outgoing = matches.filter((m) => m.flow.companyId === me && m.flow.destination !== "simbiose" && m.senderGain > 0).sort((a, b) => b.senderGain - a.senderGain);
  const incoming = matches.filter((m) => m.demand.companyId === me && m.flow.destination !== "simbiose").sort((a, b) => b.receiverSaving - a.receiverSaving);
  const pending = exchanges.filter((e) => e.status === "PROPOSED" && e.initiatorId !== me);
  const history = exchanges.filter((e) => !(e.status === "PROPOSED" && e.initiatorId !== me));

  const outIds = new Set(outgoing.map((m) => m.demand.companyId));
  const inIds = new Set(incoming.map((m) => m.flow.companyId));
  const activeIds = new Set(exchanges.filter((e) => e.status === "ACCEPTED").map((e) => (e.fromId === me ? e.toId : e.fromId)));
  const nodes: MapNode[] = companies.filter((c) => c.id !== me).map((c) => ({
    id: c.id, name: c.name, lat: c.lat, lng: c.lng,
    kind: activeIds.has(c.id) ? "active" : outIds.has(c.id) ? "out" : inIds.has(c.id) ? "in" : "other",
  }));

  return (
    <>
      <PageHeader
        title="Marketplace de resíduos"
        description="O resíduo de uma fábrica é insumo para outra. O Elo cruza material, volume, licença ambiental e distância, com o frete já descontado."
        actions={<AddDemandButton />}
      />

      {pending.length > 0 && (
        <Card className="mb-4 border-warning/40">
          <CardHeader title={`${pending.length} ${pending.length > 1 ? "propostas aguardam" : "proposta aguarda"} sua resposta`} />
          <div className="divide-y">
            {pending.map((e) => {
              const other = e.initiatorId === e.fromId ? e.from : e.to;
              const iSend = e.fromId === me;
              return (
                <div key={e.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <Avatar name={other.name} square size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px]"><b className="font-medium">{other.name}</b> {iSend ? "quer receber seu" : "quer enviar"} <b className="font-medium">{lowerFirst(e.flow.name)}</b></p>
                    <p className="tabular text-xs text-muted-foreground">{num(e.quantity)} {e.flow.unit}/mês a {money2(e.price)}/{e.flow.unit} · {relativeDate(e.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <ActionButton size="sm" variant="outline" action={respondExchange} fields={{ id: e.id, decision: "decline" }}><X />Recusar</ActionButton>
                    <ActionButton size="sm" variant="brand" action={respondExchange} fields={{ id: e.id, decision: "accept" }}><Check />Aceitar</ActionButton>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

        <div className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader title="Sua rede" description={`${companies.length - 1} indústrias num raio de ~${LOGISTICS.maxRadiusKm} km`} />
            <div className="px-3 pb-3"><NetworkMap center={{ lat: user.company.lat, lng: user.company.lng, label: user.company.initials }} nodes={nodes} /></div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 border-t px-5 py-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-success" />troca ativa</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-brand" />compra seu resíduo</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-info" />oferece insumo</span>
            </div>
          </Card>
          <Card>
            <CardHeader title="Materiais que você aceita" description="Base para encontrar fornecedores de resíduo" />
            {demands.length === 0 ? <p className="px-5 pb-5 text-[13px] text-muted-foreground">Nenhum cadastrado.</p> : (
              <div className="divide-y border-t">
                {demands.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 px-5 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">{d.description}</p>
                      <p className="tabular text-xs text-muted-foreground">até {num(d.capacity)} {category(d.category).unit}/mês · paga {money2(d.pricePaid)}</p>
                    </div>
                    <DeleteDemandButton id={d.id} label={d.description} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
        <Tabs defaultValue="out" className="min-w-0">
          <TabsList>
            <TabsTrigger value="out"><ArrowUpRight className="size-4" />Vender resíduo<Badge tone="neutral" className="ml-1">{outgoing.length}</Badge></TabsTrigger>
            <TabsTrigger value="in"><ArrowDownLeft className="size-4" />Comprar insumo<Badge tone="neutral" className="ml-1">{incoming.length}</Badge></TabsTrigger>
            <TabsTrigger value="hist">Histórico</TabsTrigger>
          </TabsList>
          <TabsContent value="out" className="mt-4">
            {outgoing.length === 0 ? <EmptyState icon={<PackageSearch />} title="Nenhum comprador por enquanto" description="Quando uma empresa próxima aceitar um dos seus resíduos, ela aparece aqui." /> : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{outgoing.map((m) => <MatchCard key={key(m.flow.id, m.demand.id)} m={m} direction="out" status={exByKey.get(key(m.flow.id, m.demand.id))} me={me} />)}</div>
            )}
          </TabsContent>
          <TabsContent value="in" className="mt-4">
            {incoming.length === 0 ? <EmptyState icon={<PackageSearch />} title="Nenhuma oferta para você" description="Cadastre os materiais que você aceita receber para encontrar fornecedores de resíduo." action={<AddDemandButton variant="default" />} /> : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{incoming.map((m) => <MatchCard key={key(m.flow.id, m.demand.id)} m={m} direction="in" status={exByKey.get(key(m.flow.id, m.demand.id))} me={me} />)}</div>
            )}
          </TabsContent>
          <TabsContent value="hist" className="mt-4">
            {history.length === 0 ? <EmptyState icon={<Handshake />} title="Nenhuma troca ainda" /> : (
              <Card className="divide-y">
                {history.map((e) => {
                  const other = e.fromId === me ? e.to : e.from;
                  return (
                    <div key={e.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-medium">{e.flow.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{e.fromId === me ? "para" : "de"} {other.name} · {num(e.quantity)} {e.flow.unit}/mês · {relativeDate(e.updatedAt)}</p>
                      </div>
                      <ExchangeStatusBadge status={e.status} />
                    </div>
                  );
                })}
              </Card>
            )}
          </TabsContent>
        </Tabs>
    </>
  );
}
