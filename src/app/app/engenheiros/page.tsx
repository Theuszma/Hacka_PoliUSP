import { GraduationCap, Star } from "lucide-react";
import { requireCompanyUser } from "@/lib/auth";
import { buildBriefing } from "@/lib/briefing";
import { category } from "@/lib/catalog";
import { companyFlows, engineersWithUsers } from "@/lib/data";
import { db } from "@/lib/db";
import { money, num, pct } from "@/lib/format";
import { lowerFirst } from "@/lib/format";
import { distanceKm } from "@/lib/geo";
import { parseSkills, rankEngineers } from "@/lib/matching";
import { flowMetrics, rankByLoss } from "@/lib/metrics";
import { PageHeader } from "@/components/shell";
import { RequestComposer, type ComposerDefaults } from "@/components/request-composer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, EmptyState, Progress } from "@/components/ui/misc";

export const metadata = { title: "Engenheiros" };

export default async function EngineersPage({ searchParams }: { searchParams: Promise<{ flow?: string }> }) {
  const { flow: focusId } = await searchParams;
  const user = await requireCompanyUser();
  const c = user.company;
  const [flows, engineers, load] = await Promise.all([
    companyFlows(c.id),
    engineersWithUsers(),
    db.supportRequest.groupBy({ by: ["assigneeId"], where: { status: "IN_PROGRESS" }, _count: true }),
  ]);
  const busy = new Map(load.map((l) => [l.assigneeId, l._count]));
  const ranked = rankEngineers(engineers.map((e) => ({ ...e, skills: parseSkills(e.skills) })), flows);
  const byLoss = rankByLoss(flows);
  const focus = byLoss.find((r) => r.flow.id === focusId) ?? byLoss[0];

  const defaultsFor = (flowId: string | null): ComposerDefaults => {
    const f = flows.find((x) => x.id === flowId) ?? focus?.flow;
    if (!f) return { title: "", category: "aco", briefing: "", hours: 20 };
    const m = flowMetrics(f);
    return {
      title: `Reduzir perda de ${lowerFirst(f.name)}`,
      category: f.category,
      briefing: buildBriefing(c, flows, f.id),
      hours: m.loss > 5000 ? 40 : m.loss > 1500 ? 24 : 16,
    };
  };

  return (
    <>
      <PageHeader
        title="Engenheiros"
        description="Estudantes e mentores voluntários da Poli, ordenados pelo quanto as áreas de cada um cobrem o seu prejuízo. Estudantes contam as horas como extensão."
        actions={focus && <RequestComposer size="sm" label="Nova demanda" defaults={defaultsFor(focus.flow.id)} />}
      />
      {focus && (
        <Card className="mb-4 flex flex-wrap items-center gap-4 p-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{focusId ? "Foco escolhido" : "Maior prejuízo"}</p>
            <p className="text-[13.5px] font-medium">{focus.flow.name} · {money(focus.metrics.loss)}/mês · perda de {pct(focus.flow.lossRate, 1)}</p>
            {focus.flow.leverText && <p className="text-xs text-muted-foreground">Caminho provável: {focus.flow.leverText.toLowerCase()}</p>}
          </div>
          <Badge tone="info">{category(focus.flow.category).skills.join(" · ")}</Badge>
        </Card>
      )}
      {ranked.length === 0 ? <EmptyState icon={<GraduationCap />} title="Nenhum engenheiro na rede ainda" /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {ranked.map(({ engineer: e, score, matchedSkills, topFlowId }) => {
            const top = flows.find((f) => f.id === topFlowId);
            const n = busy.get(e.id) ?? 0;
            return (
              <Card key={e.id} className="flex flex-col p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={e.user.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13.5px] font-medium">{e.user.name}</p>
                      <Badge tone={e.kind === "MENTOR" ? "info" : "neutral"}>{e.kind === "MENTOR" ? "Mentor(a)" : "Estudante"}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{e.course}</p>
                  </div>
                  <span className="tabular flex items-center gap-1 text-xs text-muted-foreground"><Star className="size-3.5 fill-warning text-warning" />{num(e.rating, 1)}</span>
                </div>
                <p className="mt-3 line-clamp-2 text-[13px] text-muted-foreground">{e.bio}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {e.skills.map((s) => <Badge key={s} tone={matchedSkills.includes(s) ? "brand" : "outline"}>{s}</Badge>)}
                </div>
                <div className="mt-4 grid gap-1.5">
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Aderência ao seu prejuízo</span><span className="tabular font-medium">{pct(score)}</span></div>
                  <Progress value={score * 100} />
                </div>
                <div className="mt-4 flex items-center justify-between gap-2 border-t pt-3">
                  <p className="text-xs text-muted-foreground">{e.hoursPerWeek} h/semana · {num(distanceKm(c, e), 0)} km{n ? ` · ${n} em andamento` : ""}</p>
                  <RequestComposer size="sm" variant={score > 0 ? "default" : "outline"} label="Convidar" invited={{ id: e.id, name: e.user.name }} defaults={defaultsFor(top?.id ?? null)} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
