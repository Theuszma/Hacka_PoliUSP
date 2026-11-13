import { Clock, Factory, Leaf, PiggyBank, Recycle, Sparkles, Truck, Users } from "lucide-react";
import Link from "next/link";
import { currentUser, homeFor } from "@/lib/auth";
import { money, num, tons } from "@/lib/format";
import { networkImpact } from "@/lib/network";
import { AppShell, PageHeader } from "@/components/shell";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { Stat } from "@/components/domain";
import { Card, CardHeader } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/misc";

export const dynamic = "force-dynamic";
export const metadata = { title: "Impacto da rede" };

async function Content() {
  const n = await networkImpact();
  const circularShare = n.networkWasteKg ? 1 - n.landfillKg / n.networkWasteKg : 0;
  return (
    <>
      <PageHeader eyebrow="Atualizado em tempo real" title="Impacto da rede" description="Resultados de todas as indústrias e engenheiros do Elo, calculados a partir das trocas aceitas e das demandas concluídas." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat tone="emerald" label="Resíduo desviado do aterro" value={tons(n.divertedKg)} unit="/mês" icon={<Truck />} hint={`${n.activeExchanges} trocas ativas`} />
        <Stat tone="amber" label="Valor gerado nas trocas" value={money(n.exchangeValue)} unit="/mês" icon={<PiggyBank />} hint="receita de quem envia + economia de quem recebe" />
        <Stat tone="sky" label="CO₂e evitado" value={tons(n.co2Avoided)} unit="/mês" icon={<Leaf />} hint="matéria-prima virgem substituída" />
        <Stat tone="violet" label="Engenharia aplicada" value={num(n.engineeringHours)} unit="h" icon={<Clock />} hint={`${money(n.engineeringSavings)}/mês economizados`} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Trocas ativas" description="Resíduo de uma indústria virando insumo de outra" />
          <div className="divide-y border-t">
            {n.exchanges.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium">{e.flow.name}</p>
                  <p className="text-xs text-muted-foreground">{e.from.name} → {e.to.name}</p>
                </div>
                <p className="tabular text-[13px] text-muted-foreground">{num(e.quantity)} {e.flow.unit}/mês</p>
              </div>
            ))}
          </div>
        </Card>
        <div className="grid content-start gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 text-[13px] font-medium"><Sparkles className="size-4 text-brand" />Potencial ainda não aproveitado</div>
            <p className="tabular mt-2 text-[26px] font-semibold leading-none">{money(n.untappedValue)}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
            <p className="mt-2 text-xs text-muted-foreground">em {n.untappedCount} resíduos que já têm comprador na rede, mas ainda não foram negociados.</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 text-[13px] font-medium"><Recycle className="size-4" />Circularidade da rede</div>
            <p className="tabular mt-2 text-[26px] font-semibold leading-none">{Math.round(circularShare * 100)}%</p>
            <Progress value={circularShare * 100} className="mt-3" />
            <p className="mt-2 text-xs text-muted-foreground">{tons(n.landfillKg)}/mês ainda vão para aterro ou incineração.</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-2 text-[13px] font-medium"><Factory className="size-4" />{n.companies} indústrias · <Users className="size-4" />{n.engineers} engenheiros</div>
            <ul className="mt-3 grid gap-1.5 text-xs text-muted-foreground">
              {n.sectors.map(([s, c]) => <li key={s} className="flex justify-between"><span>{s}</span><span className="tabular">{c}</span></li>)}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}

export default async function ImpactPage() {
  const user = await currentUser();
  const ready = user && (user.role === "COMPANY" ? !!user.company?.onboardedAt : !!user.engineer);
  if (user && ready) return <AppShell user={user}><Content /></AppShell>;
  return (
    <div className="min-h-dvh">
      <PublicHeader loggedHref={user ? homeFor(user) : null} />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Content />
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-subtle p-6">
          <p className="text-[15px] font-medium">Sua fábrica pode fazer parte desses números.</p>
          <Link href="/cadastro" className={buttonVariants()}>Criar conta grátis</Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
