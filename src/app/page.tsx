import {
  ArrowRight, BarChart3, Boxes, Check, Clock, FileSpreadsheet, FlaskConical, GraduationCap, Handshake, Leaf, MapPin, Recycle, ShieldCheck, Sparkles, TrendingDown,
} from "lucide-react";
import Link from "next/link";
import { demoSignIn } from "@/app/actions";
import { currentUser, homeFor } from "@/lib/auth";
import { money, num, pct, tons } from "@/lib/format";
import { showcase, type Showcase } from "@/lib/showcase";
import { networkImpact } from "@/lib/network";
import { PublicFooter, PublicHeader } from "@/components/public-header";
import { SubmitButton } from "@/components/forms";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";

export const dynamic = "force-dynamic";

const TONES = {
  emerald: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400",
  sky: "bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-400",
  amber: "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400",
  violet: "bg-violet-500/10 text-violet-600 ring-violet-500/20 dark:text-violet-400",
  rose: "bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:text-rose-400",
  teal: "bg-teal-500/10 text-teal-600 ring-teal-500/20 dark:text-teal-400",
} as const;
type Tone = keyof typeof TONES;

function IconChip({ icon: I, tone, size = "md" }: { icon: typeof TrendingDown; tone: Tone; size?: "md" | "lg" }) {
  return (
    <div className={cn("grid place-items-center rounded-lg ring-1 ring-inset", TONES[tone], size === "lg" ? "size-11" : "size-9")}>
      <I className={size === "lg" ? "size-5" : "size-[18px]"} />
    </div>
  );
}

const signed = (v: number | null, fmt: (x: number) => string) => (v === null ? "" : `${v > 0 ? "+" : "−"}${fmt(Math.abs(v))}`);

function ProductPreview({ data }: { data: Showcase }) {
  const max = Math.max(...data.series.map((s) => s.loss), 1);
  const t = data.totals;
  const kpis = [
    ["Prejuízo com resíduos", money(t.loss), signed(data.delta.loss, (x) => pct(x, 1)), "rose", data.delta.loss !== null && data.delta.loss < 0],
    ["Taxa de desperdício", pct(t.wasteRate, 1), signed(data.delta.wasteRate, (x) => `${num(x * 100, 1)} p.p.`), "amber", data.delta.wasteRate !== null && data.delta.wasteRate < 0],
    ["CO₂e no material perdido", tons(t.embodiedCo2), signed(data.delta.co2, (x) => pct(x, 1)), "sky", data.delta.co2 !== null && data.delta.co2 < 0],
    ["Circularidade", pct(t.circularity), signed(data.delta.circularity, (x) => `${num(x * 100, 1)} p.p.`), "emerald", data.delta.circularity !== null && data.delta.circularity > 0],
  ] as const;
  return (
    <div className="relative mx-auto mt-16 max-w-5xl text-left">
      <div className="absolute -inset-4 -z-10 rounded-[28px] bg-gradient-to-b from-emerald-400/30 via-teal-400/10 to-transparent blur-2xl" />
      <div className="overflow-hidden rounded-xl border border-white/10 bg-card text-card-foreground shadow-2xl shadow-emerald-950/40 ring-1 ring-white/5">
        <div className="flex items-center gap-1.5 border-b bg-subtle px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-rose-400" /><span className="size-2.5 rounded-full bg-amber-400" /><span className="size-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 truncate rounded-md bg-background px-2 py-0.5 text-[11px] text-muted-foreground">{data.name} · {data.city} · dados ao vivo da conta de demonstração</span>
        </div>
        <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-[180px_minmax(0,1fr)]">
          <div className="hidden gap-1 text-[12px] md:grid md:content-start">
            {[["Visão geral", true], ["Insumos e resíduos"], ["Simulador"], ["Marketplace"], ["Engenheiros"], ["Demandas"]].map(([l, a]) => (
              <span key={String(l)} className={cn("rounded-md px-2 py-1.5", a ? "bg-brand-soft font-medium text-brand" : "text-muted-foreground")}>{l}</span>
            ))}
          </div>
          <div className="grid min-w-0 gap-3">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {kpis.map(([l, v, d, c, good]) => (
                <div key={l} className="relative overflow-hidden rounded-lg border p-3">
                  <span className={cn("absolute inset-x-0 top-0 h-0.5", { rose: "bg-rose-500", amber: "bg-amber-500", sky: "bg-sky-500", emerald: "bg-emerald-500" }[c])} />
                  <p className="truncate text-[11px] text-muted-foreground">{l}</p>
                  <p className="tabular mt-1 text-lg font-semibold">{v}</p>
                  <p className={cn("tabular h-4 text-[11px] font-medium", good ? "text-success" : "text-danger")}>{d && `${d} no mês`}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <div className="rounded-lg border p-3">
                <p className="text-[12px] font-medium">Prejuízo mensal com resíduos</p>
                <div className="mt-3 flex h-28 items-end gap-1.5">
                  {data.series.map((s, i) => (
                    <div key={s.label} title={`${s.label}: ${money(s.loss)}`} className={cn("flex-1 rounded-t-sm bg-gradient-to-t", i === data.series.length - 1 ? "from-emerald-600 to-teal-400" : "from-emerald-500/30 to-teal-400/20")} style={{ height: `${Math.max(8, (s.loss / max) * 100)}%` }} />
                  ))}
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground"><span>{data.series[0]?.label}</span><span>{data.series[data.series.length - 1]?.label}</span></div>
              </div>
              <div className="grid content-start gap-2 rounded-lg border p-3">
                <p className="text-[12px] font-medium">Oportunidades</p>
                {data.opportunities.map((o) => (
                  <div key={o.label} className="flex items-center justify-between gap-2 rounded-md bg-subtle px-2 py-1.5">
                    <div className="min-w-0"><p className={cn("text-[10px] font-medium", o.kind === "process" ? "text-sky-600 dark:text-sky-400" : "text-emerald-600 dark:text-emerald-400")}>{o.kind === "process" ? "Melhoria de processo" : "Troca de resíduo"}</p><p className="truncate text-[11.5px] font-medium">{o.label}</p></div>
                    <span className="tabular shrink-0 text-[11.5px] font-semibold text-success">+{money(o.value)}</span>
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
  const [user, n, demo] = await Promise.all([currentUser(), networkImpact(), showcase()]);
  const loggedHref = user ? homeFor(user) : null;

  return (
    <div className="min-h-dvh overflow-x-clip bg-background">
      <PublicHeader loggedHref={loggedHref} dark />

      {/* Hero: sempre escuro, com aurora verde */}
      <section className="dark relative isolate overflow-hidden bg-zinc-950 text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(16,185,129,0.35),transparent_70%),radial-gradient(40%_40%_at_85%_30%,rgba(20,184,166,0.25),transparent_70%),radial-gradient(35%_35%_at_10%_40%,rgba(132,204,22,0.15),transparent_70%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pt-24">
          <span className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
            <Sparkles className="size-3.5" />Rede piloto no ABC Paulista · Hack@Poli 2026
          </span>
          <h1 className="mx-auto max-w-4xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Transforme resíduo industrial em{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-teal-300 to-lime-300 bg-clip-text text-transparent">margem</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-[15px] text-zinc-400 sm:text-lg">
            O Elo mostra quanto sua fábrica perde em material, conecta seu resíduo a quem usa ele como insumo e traz engenheiros da Poli para atacar as maiores perdas.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href={loggedHref ?? "/cadastro"} className={cn(buttonVariants({ size: "lg" }), "bg-gradient-to-r from-emerald-400 to-teal-400 text-zinc-950 shadow-lg shadow-emerald-500/25 hover:opacity-90")}>
              {loggedHref ? "Abrir painel" : "Começar grátis"}<ArrowRight />
            </Link>
            {!loggedHref && (
              <form action={demoSignIn}>
                <input type="hidden" name="email" value="rosana@ipiranga.demo" />
                <SubmitButton size="lg" variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" pendingText="Abrindo demonstração…">Ver demonstração</SubmitButton>
              </form>
            )}
          </div>
          <p className="mt-4 text-xs text-zinc-500">Sem cartão. Diagnóstico em 5 minutos com os dados de compras que você já tem.</p>
          {demo && <ProductPreview data={demo} />}
        </div>
      </section>

      {/* Números da rede */}
      <section className="relative border-b bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4">
          {[
            [money(n.networkLoss * 12), "em perdas mapeadas por ano"],
            [`${tons(n.divertedKg)}/mês`, "de resíduo desviado do aterro"],
            [money(n.untappedValue), "por mês em trocas possíveis"],
            [`${n.companies} + ${n.engineers}`, "indústrias e engenheiros na rede"],
          ].map(([v, l]) => (
            <div key={l}><dt className="tabular text-2xl font-semibold tracking-tight sm:text-3xl">{v}</dt><dd className="mt-1 text-[13px] text-emerald-50/80">{l}</dd></div>
          ))}
        </dl>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="relative scroll-mt-16 overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(50%_60%_at_50%_0%,hsl(var(--brand)/0.10),transparent)]" />
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-brand">Como funciona</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">Do dado de compra à economia validada, em três passos.</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {([
              [FileSpreadsheet, "emerald", "01", "Mapeie", "Cadastre os insumos ou importe a planilha de compras. O Elo sugere os materiais típicos do seu setor e a perda de referência.", "from-emerald-500 to-teal-400"],
              [BarChart3, "sky", "02", "Entenda", "Veja o prejuízo em reais, a taxa de desperdício, o CO₂e e a circularidade, mês a mês, comparados ao seu setor.", "from-sky-500 to-indigo-400"],
              [Handshake, "amber", "03", "Aja", "Venda resíduo para vizinhos que usam ele como insumo e convide engenheiros para reduzir a perda na origem.", "from-amber-500 to-orange-400"],
            ] as const).map(([Icon, tone, num, t, d, grad]) => (
              <div key={t} className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop">
                <span className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", grad)} />
                <div className="flex items-center justify-between">
                  <IconChip icon={Icon} tone={tone} size="lg" />
                  <span className={cn("bg-gradient-to-br bg-clip-text text-4xl font-bold text-transparent opacity-30", grad)}>{num}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{t}</h3>
                <p className="mt-1.5 text-[13.5px] text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Indústrias */}
      <section id="industrias" className="scroll-mt-16 border-y bg-gradient-to-br from-emerald-50 via-teal-50/60 to-sky-50 dark:from-emerald-950/40 dark:via-zinc-950 dark:to-sky-950/30">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Para pequenas e médias indústrias</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">O controle de perdas que só as grandes tinham.</h2>
            <p className="mt-3 text-[15px] text-muted-foreground">Sem consultoria cara e sem implantar ERP novo. O Elo usa os dados que você já tem e devolve decisões com valor em reais.</p>
            <ul className="mt-6 grid gap-3 text-[14px]">
              {["Diagnóstico de perdas com benchmark do setor", "Histórico mensal e rastreabilidade por fornecedor e lote", "Simulador de cenários antes de investir", "Marketplace de resíduos com frete e licença ambiental considerados"].map((x) => (
                <li key={x} className="flex gap-2.5"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-500 text-white"><Check className="size-3" /></span>{x}</li>
              ))}
            </ul>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {([
              [TrendingDown, "rose", "Diagnóstico", "Onde está o prejuízo, por material."],
              [FlaskConical, "violet", "Simulador", "Quanto cada melhoria vale por ano."],
              [Recycle, "emerald", "Marketplace", "Resíduo de um, insumo do outro."],
              [MapPin, "sky", "Rede local", "Parceiros num raio de 40 km."],
              [Boxes, "amber", "Importação", "Planilha CSV do ERP em segundos."],
              [ShieldCheck, "teal", "Conformidade", "Resíduo Classe I só para licenciados."],
            ] as const).map(([Icon, tone, t, d]) => (
              <div key={t} className="rounded-xl border bg-card/80 p-4 shadow-xs backdrop-blur transition hover:shadow-card">
                <IconChip icon={Icon} tone={tone} />
                <p className="mt-3 text-[14px] font-medium">{t}</p>
                <p className="text-[13px] text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Engenheiros */}
      <section id="engenheiros" className="scroll-mt-16">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div className="relative order-2 lg:order-1">
            <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-violet-500/20 via-indigo-500/10 to-sky-500/20 blur-2xl" />
            <div className="rounded-2xl border bg-card p-5 shadow-pop">
              <div className="flex items-start gap-3">
                <div className="grid size-9 place-items-center rounded-lg bg-sky-600 text-[12px] font-semibold text-white">CB</div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium">Reduzir perda de retalho têxtil</p>
                  <p className="text-xs text-muted-foreground">Confecções Bom Retiro · São Paulo · 14 km</p>
                </div>
                <Badge tone="brand" dot>Convite</Badge>
              </div>
              <p className="mt-3 text-[13px] text-muted-foreground">Perda de 20% no corte de tecido. Briefing gerado a partir do diagnóstico, com consumo, destino atual e prejuízo de cada insumo.</p>
              <div className="mt-3 flex flex-wrap gap-1"><Badge tone="brand">têxtil</Badge><Badge tone="brand">corte</Badge><Badge tone="outline">modelagem</Badge></div>
              <div className="mt-4 grid gap-1">
                <div className="flex justify-between text-xs"><span className="text-muted-foreground">Aderência às suas áreas</span><span className="font-medium">67%</span></div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full w-2/3 rounded-full bg-gradient-to-r from-violet-500 to-sky-500" /></div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground"><span><b className="text-foreground">R$ 38.760</b>/mês em jogo</span><span className="flex items-center gap-1"><Clock className="size-3.5" />24 h de extensão</span></div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-[13px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">Para estudantes e engenheiros</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Problemas reais da indústria, com impacto medido.</h2>
            <p className="mt-3 text-[15px] text-muted-foreground">Estudantes ganham horas de extensão e portfólio. Mentores devolvem experiência para a indústria do bairro. Cada demanda termina com a economia validada pela empresa.</p>
            <ul className="mt-6 grid gap-3 text-[14px]">
              {["Demandas ordenadas pela aderência às suas áreas", "Briefing técnico pronto, com os números da fábrica", "Relatório de horas e resultados para a extensão"].map((x) => (
                <li key={x} className="flex gap-2.5"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-violet-500 text-white"><GraduationCap className="size-3" /></span>{x}</li>
              ))}
            </ul>
            <Link href="/cadastro?perfil=engenheiro" className={cn(buttonVariants(), "mt-8 bg-violet-600 text-white hover:bg-violet-600/90")}>Quero ajudar como engenheiro(a)<ArrowRight /></Link>
          </div>
        </div>
      </section>

      {/* ODS */}
      <section className="border-t bg-subtle">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wider text-brand">Agenda 2030</p>
            <h2 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight">Menos desperdício, mais indústria nacional.</h2>
            <p className="mt-3 max-w-xl text-[15px] text-muted-foreground">Inovação na base industrial e produção responsável, começando pelas fábricas que mais precisam e conectando a engenharia da universidade a quem faz o país produzir.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:w-[420px]">
            <div className="rounded-2xl bg-[#F36D25] p-5 text-white shadow-card">
              <p className="text-4xl font-bold">9</p>
              <p className="mt-2 text-[13px] font-semibold uppercase leading-tight">Indústria, inovação e infraestrutura</p>
            </div>
            <div className="rounded-2xl bg-[#BF8B2E] p-5 text-white shadow-card">
              <p className="text-4xl font-bold">12</p>
              <p className="mt-2 text-[13px] font-semibold uppercase leading-tight">Consumo e produção responsáveis</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-4 py-20 sm:px-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-zinc-950 px-6 py-16 text-center text-white sm:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_0%_100%,rgba(16,185,129,0.45),transparent_60%),radial-gradient(50%_80%_at_100%_0%,rgba(14,165,233,0.35),transparent_60%)]" />
          <div className="relative">
            <Leaf className="mx-auto size-7 text-emerald-300" />
            <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">Descubra quanto sua fábrica perde em 5 minutos.</h2>
            <p className="mx-auto mt-3 max-w-xl text-[15px] text-zinc-300">Crie a conta, escolha o setor e receba o diagnóstico com os parceiros mais próximos.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href={loggedHref ?? "/cadastro"} className={cn(buttonVariants({ size: "lg" }), "bg-white text-zinc-950 hover:bg-white/90")}>{loggedHref ? "Abrir painel" : "Criar conta grátis"}<ArrowRight /></Link>
              <Link href="/impacto" className={cn(buttonVariants({ size: "lg", variant: "ghost" }), "text-white hover:bg-white/10")}>Ver impacto da rede</Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
