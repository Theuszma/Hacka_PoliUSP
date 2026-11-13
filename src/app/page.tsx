import {
  ArrowRight, BarChart3, Boxes, Check, FileSpreadsheet, FlaskConical, GraduationCap, Handshake, Leaf, MapPin, Recycle, ShieldCheck, TrendingDown,
} from "lucide-react";
import Link from "next/link";
import { demoSignIn } from "@/app/actions";
import { currentUser, homeFor } from "@/lib/auth";
import { money, tons } from "@/lib/format";
import { networkImpact } from "@/lib/network";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { SubmitButton } from "@/components/forms";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";

export const dynamic = "force-dynamic";

function ProductPreview() {
  const bars = [62, 58, 64, 55, 57, 51, 49, 46, 44, 41, 37, 33];
  return (
    <div className="relative mx-auto mt-14 max-w-5xl text-left">
      <div className="absolute -inset-x-10 -top-10 bottom-0 -z-10 bg-[radial-gradient(ellipse_at_top,hsl(var(--brand)/0.18),transparent_60%)]" />
      <div className="overflow-hidden rounded-xl border bg-card shadow-pop">
        <div className="flex items-center gap-1.5 border-b bg-subtle px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-border" /><span className="size-2.5 rounded-full bg-border" /><span className="size-2.5 rounded-full bg-border" />
          <span className="ml-3 rounded-md bg-background px-2 py-0.5 text-[11px] text-muted-foreground">elo.app/app</span>
        </div>
        <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-[180px_minmax(0,1fr)]">
          <div className="hidden gap-1 text-[12px] md:grid md:content-start">
            {[["Visão geral", true], ["Insumos e resíduos"], ["Simulador"], ["Marketplace"], ["Engenheiros"], ["Demandas"]].map(([l, a]) => (
              <span key={String(l)} className={cn("rounded-md px-2 py-1.5", a ? "bg-muted font-medium" : "text-muted-foreground")}>{l}</span>
            ))}
          </div>
          <div className="grid min-w-0 gap-3">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[["Prejuízo com resíduos", "R$ 24.090", "−8,2%"], ["Taxa de desperdício", "14,6%", "−1,1 p.p."], ["CO₂e no material perdido", "9,8 t", "−6,0%"], ["Circularidade", "41%", "+12 p.p."]].map(([l, v, d]) => (
                <div key={l} className="rounded-lg border p-3">
                  <p className="truncate text-[11px] text-muted-foreground">{l}</p>
                  <p className="tabular mt-1 text-lg font-semibold">{v}</p>
                  <p className="text-[11px] font-medium text-success">{d}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <div className="rounded-lg border p-3">
                <p className="text-[12px] font-medium">Prejuízo mensal com resíduos</p>
                <div className="mt-3 flex h-28 items-end gap-1.5">
                  {bars.map((h, i) => <div key={i} className={cn("flex-1 rounded-t-sm", i === bars.length - 1 ? "bg-brand" : "bg-brand/25")} style={{ height: `${h + 30}%` }} />)}
                </div>
              </div>
              <div className="grid gap-2 rounded-lg border p-3">
                <p className="text-[12px] font-medium">Oportunidades</p>
                {[["Troca de resíduo", "Retalho de chapa → Ferragens Rudge", "+R$ 3.180"], ["Melhoria de processo", "Overspray de tinta", "+R$ 2.430"], ["Troca de resíduo", "Pallets → Marcenaria Vila Gerty", "+R$ 610"]].map(([t, l, v]) => (
                  <div key={l} className="flex items-center justify-between gap-2 rounded-md bg-subtle px-2 py-1.5">
                    <div className="min-w-0"><p className="text-[10px] text-muted-foreground">{t}</p><p className="truncate text-[11.5px] font-medium">{l}</p></div>
                    <span className="tabular text-[11.5px] font-semibold text-success">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function Landing() {
  const [user, n] = await Promise.all([currentUser(), networkImpact()]);
  const loggedHref = user ? homeFor(user) : null;

  return (
    <div className="min-h-dvh overflow-x-clip">
      <PublicHeader loggedHref={loggedHref} />

      <section className="relative border-b">
        <div className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-16 text-center sm:px-6 sm:pt-24">
          <Badge tone="outline" className="mx-auto mb-5 bg-background px-3 py-1 text-xs"><span className="mr-1.5 size-1.5 rounded-full bg-brand" />Rede piloto no ABC Paulista</Badge>
          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Transforme resíduo industrial em margem.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-[15px] text-muted-foreground sm:text-lg">
            O Elo mostra quanto sua fábrica perde em material, conecta seu resíduo a quem usa ele como insumo e traz engenheiros da Poli para atacar as maiores perdas.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={loggedHref ?? "/cadastro"} className={buttonVariants({ size: "lg" })}>{loggedHref ? "Abrir painel" : "Começar grátis"}<ArrowRight /></Link>
            {!loggedHref && (
              <form action={demoSignIn}>
                <input type="hidden" name="email" value="rosana@ipiranga.demo" />
                <SubmitButton size="lg" variant="outline" pendingText="Abrindo demonstração…">Ver demonstração</SubmitButton>
              </form>
            )}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Sem cartão. Diagnóstico em 5 minutos com os dados de compras que você já tem.</p>
          <ProductPreview />
        </div>
      </section>

      <section className="border-b bg-subtle">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4">
          {[
            [money(n.networkLoss * 12), "em perdas mapeadas por ano"],
            [`${tons(n.divertedKg)}/mês`, "de resíduo desviado do aterro"],
            [money(n.untappedValue), "por mês em trocas possíveis"],
            [`${n.companies} + ${n.engineers}`, "indústrias e engenheiros na rede"],
          ].map(([v, l]) => (
            <div key={l}><dt className="tabular text-2xl font-semibold tracking-tight">{v}</dt><dd className="mt-1 text-[13px] text-muted-foreground">{l}</dd></div>
          ))}
        </dl>
      </section>

      <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-20 sm:px-6">
        <p className="text-[13px] font-medium text-brand">Como funciona</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight">Do dado de compra à economia validada, em três passos.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            [FileSpreadsheet, "1. Mapeie", "Cadastre os insumos ou importe a planilha de compras. O Elo sugere os materiais típicos do seu setor e a perda de referência."],
            [BarChart3, "2. Entenda", "Veja o prejuízo em reais, a taxa de desperdício, o CO₂e e a circularidade, mês a mês, comparados ao seu setor."],
            [Handshake, "3. Aja", "Venda resíduo para vizinhos que usam ele como insumo e convide engenheiros para reduzir a perda na origem."],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof FileSpreadsheet;
            return (
              <div key={t as string} className="rounded-xl border bg-card p-6">
                <div className="grid size-9 place-items-center rounded-lg bg-muted"><I className="size-[18px]" /></div>
                <h3 className="mt-4 font-semibold">{t as string}</h3>
                <p className="mt-1.5 text-[13.5px] text-muted-foreground">{d as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="industrias" className="scroll-mt-16 border-y bg-subtle">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-[13px] font-medium text-brand">Para pequenas e médias indústrias</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">O controle de perdas que só as grandes tinham.</h2>
            <p className="mt-3 text-[15px] text-muted-foreground">Sem consultoria cara e sem implantar ERP novo. O Elo usa os dados que você já tem e devolve decisões com valor em reais.</p>
            <ul className="mt-6 grid gap-3 text-[14px]">
              {["Diagnóstico de perdas com benchmark do setor", "Histórico mensal e rastreabilidade por fornecedor e lote", "Simulador de cenários antes de investir", "Marketplace de resíduos com frete e licença ambiental considerados"].map((x) => (
                <li key={x} className="flex gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-brand" />{x}</li>
              ))}
            </ul>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              [TrendingDown, "Diagnóstico", "Onde está o prejuízo, por material."],
              [FlaskConical, "Simulador", "Quanto cada melhoria vale por ano."],
              [Recycle, "Marketplace", "Resíduo de um, insumo do outro."],
              [MapPin, "Rede local", "Parceiros num raio de 40 km."],
              [Boxes, "Importação", "Planilha CSV do ERP em segundos."],
              [ShieldCheck, "Conformidade", "Resíduo Classe I só para licenciados."],
            ].map(([Icon, t, d]) => {
              const I = Icon as typeof TrendingDown;
              return (
                <div key={t as string} className="rounded-xl border bg-card p-4">
                  <I className="size-[18px] text-muted-foreground" />
                  <p className="mt-3 text-[14px] font-medium">{t as string}</p>
                  <p className="text-[13px] text-muted-foreground">{d as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="engenheiros" className="mx-auto grid max-w-6xl scroll-mt-16 gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div className="order-2 rounded-xl border bg-card p-5 lg:order-1">
          <div className="flex items-start gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-muted text-[12px] font-semibold">CB</div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium">Reduzir perda de retalho têxtil</p>
              <p className="text-xs text-muted-foreground">Confecções Bom Retiro · São Paulo · 14 km</p>
            </div>
            <Badge tone="brand" dot>Convite</Badge>
          </div>
          <p className="mt-3 text-[13px] text-muted-foreground">Perda de 19% no corte de malha. Briefing gerado a partir do diagnóstico, com consumo, destino atual e prejuízo de cada insumo.</p>
          <div className="mt-3 flex flex-wrap gap-1"><Badge tone="brand">têxtil</Badge><Badge tone="brand">corte</Badge><Badge tone="outline">modelagem</Badge></div>
          <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground"><span><b className="text-foreground">R$ 4.870</b>/mês em jogo</span><span>24 h de extensão</span></div>
        </div>
        <div className="order-1 lg:order-2">
          <p className="text-[13px] font-medium text-brand">Para estudantes e engenheiros</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Problemas reais da indústria, com impacto medido.</h2>
          <p className="mt-3 text-[15px] text-muted-foreground">Estudantes ganham horas de extensão e portfólio. Mentores devolvem experiência para a indústria do bairro. Cada demanda termina com a economia validada pela empresa.</p>
          <ul className="mt-6 grid gap-3 text-[14px]">
            {["Demandas ordenadas pela aderência às suas áreas", "Briefing técnico pronto, com os números da fábrica", "Relatório de horas e resultados para a extensão"].map((x) => (
              <li key={x} className="flex gap-2.5"><GraduationCap className="mt-0.5 size-4 shrink-0 text-brand" />{x}</li>
            ))}
          </ul>
          <Link href="/cadastro?perfil=engenheiro" className={cn(buttonVariants({ variant: "outline" }), "mt-8")}>Quero ajudar como engenheiro(a)<ArrowRight /></Link>
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
          <Leaf className="mx-auto size-6 text-brand" />
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight">Menos desperdício, mais indústria nacional.</h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] text-muted-foreground">Inovação na base industrial (ODS 9) e produção responsável (ODS 12), começando pelas fábricas que mais precisam.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={loggedHref ?? "/cadastro"} className={buttonVariants({ size: "lg" })}>{loggedHref ? "Abrir painel" : "Criar conta grátis"}</Link>
            <Link href="/impacto" className={buttonVariants({ size: "lg", variant: "ghost" })}>Ver impacto da rede</Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
