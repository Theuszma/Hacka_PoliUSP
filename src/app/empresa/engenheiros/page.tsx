import { requireCompanyUser } from "@/lib/auth";
import { buildBriefing } from "@/lib/briefing";
import { companyFlows, engineersWithUsers } from "@/lib/data";
import { money, pct } from "@/lib/format";
import { flowSkills, parseSkills, rankEngineers } from "@/lib/matching";
import { rankByLoss } from "@/lib/metrics";
import { RequestComposer, type EngineerCard } from "@/components/request-composer";
import { PageHeader } from "@/components/ui";
import { initials } from "@/components/ui";

export const metadata = { title: "Engenheiros" };

export default async function EngineersPage({ searchParams }: { searchParams: Promise<{ foco?: string }> }) {
  const { foco } = await searchParams;
  const user = await requireCompanyUser();
  const [flows, engineers] = await Promise.all([companyFlows(user.company.id), engineersWithUsers()]);
  const ranked = rankByLoss(flows);
  const focus = ranked.find((r) => r.flow.id === foco) ?? ranked[0];
  const fits = rankEngineers(engineers.map((e) => ({ ...e, skills: parseSkills(e.skills) })), flows);
  const flowName = (id: string | null) => flows.find((f) => f.id === id)?.name ?? null;

  const cards: EngineerCard[] = fits.map(({ engineer: e, matchedSkills, topFlowId, score }) => ({
    id: e.id, name: e.user.name, initials: initials(e.user.name), kind: e.kind, course: e.course, bio: e.bio,
    skills: e.skills, matchedSkills, hoursPerWeek: e.hoursPerWeek, rating: e.rating, helpsWith: flowName(topFlowId), score,
  }));

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Conexão com a engenharia" title="Engenheiros e estudantes para o seu problema">
        O match compara as áreas técnicas de cada pessoa com os seus insumos e dá mais peso a quem cobre as maiores perdas.
      </PageHeader>
      {focus && (
        <div className="card flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div><span className="label">Foco</span><p><b>{focus.flow.name}</b> · {money(focus.metrics.loss * 12)}/ano · {pct(focus.flow.lossRate)} de perda</p></div>
          <div className="flex flex-wrap items-center gap-1"><span className="mr-1 text-muted">Áreas procuradas:</span>{flowSkills(focus.flow).map((s) => <span key={s} className="tag tag-hit">{s}</span>)}</div>
        </div>
      )}
      <RequestComposer
        engineers={cards}
        defaults={{
          title: focus ? `Reduzir a perda de ${focus.flow.name} (${pct(focus.flow.lossRate)})` : "Apoio para reduzir desperdício",
          briefing: buildBriefing(user.company, flows, focus?.flow.id),
          category: focus?.flow.category ?? "aco",
        }}
      />
    </div>
  );
}
