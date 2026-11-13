import { requireEngineerUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseSkills, rankRequestsForEngineer } from "@/lib/matching";
import { RequestCard } from "@/components/request-card";
import { Empty, Kpi, PageHeader } from "@/components/ui";

export const metadata = { title: "Demandas abertas" };

export default async function OpenRequestsPage() {
  const user = await requireEngineerUser();
  const me = user.engineer;
  const [open, mine] = await Promise.all([
    db.supportRequest.findMany({ where: { status: "OPEN" }, include: { company: true } }),
    db.supportRequest.findMany({ where: { assigneeId: me.id } }),
  ]);
  const ranked = rankRequestsForEngineer(open, { skills: parseSkills(me.skills), lat: me.lat, lng: me.lng });
  // convites diretos primeiro
  ranked.sort((a, b) => Number(b.request.invitedId === me.id) - Number(a.request.invitedId === me.id));
  const hoursDone = mine.filter((r) => r.status === "DONE").reduce((s, r) => s + r.estimatedHours, 0);
  const hoursActive = mine.filter((r) => r.status === "IN_PROGRESS").reduce((s, r) => s + r.estimatedHours, 0);

  return (
    <div className="grid gap-6">
      <PageHeader eyebrow={`Olá, ${user.name.split(" ")[0]}`} title="Demandas de PMEs para você">
        Ordenadas pela aderência às suas áreas ({parseSkills(me.skills).join(", ")}) e pelo prejuízo da empresa.
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi tone="accent" label="Demandas abertas" value={open.length} hint="esperando um engenheiro na rede" />
        <Kpi label="Em andamento com você" value={mine.filter((r) => r.status === "IN_PROGRESS").length} hint={`${hoursActive} h previstas`} />
        <Kpi label="Horas de extensão concluídas" value={`${hoursDone} h`} hint="validadas pelas empresas atendidas" />
      </div>
      {ranked.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ranked.map(({ request, matchedSkills, distanceKm, fit }) => (
            <RequestCard key={request.id} r={request} matchedSkills={matchedSkills} distanceKm={distanceKm} highlight={fit > 0} invited={request.invitedId === me.id} />
          ))}
        </div>
      ) : (
        <Empty>Nenhuma demanda aberta agora. Você recebe as novas aqui assim que uma empresa publicar.</Empty>
      )}
    </div>
  );
}
