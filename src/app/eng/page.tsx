import { Inbox } from "lucide-react";
import { requireEngineerUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { parseSkills, rankRequestsForEngineer } from "@/lib/matching";
import { PageHeader } from "@/components/shell";
import { RequestCard } from "@/components/request-row";
import { EmptyState } from "@/components/ui/misc";

export const metadata = { title: "Demandas abertas" };

export default async function EngineerHome() {
  const user = await requireEngineerUser();
  const e = user.engineer;
  const open = await db.supportRequest.findMany({ where: { status: "OPEN" }, include: { company: true } });
  const ranked = rankRequestsForEngineer(open, { skills: parseSkills(e.skills), lat: e.lat, lng: e.lng });
  const invites = ranked.filter((r) => r.request.invitedId === e.id);
  const rest = ranked.filter((r) => r.request.invitedId !== e.id);
  const total = open.reduce((s, r) => s + r.monthlyLoss, 0);

  return (
    <>
      <PageHeader
        eyebrow={`Olá, ${user.name.split(" ")[0]}`}
        title="Demandas abertas"
        description={open.length ? `${open.length} indústrias pedem apoio técnico, somando ${money(total)} por mês em perdas. Ordenadas pela aderência às suas áreas.` : "Nenhuma demanda aberta no momento."}
      />
      {invites.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-[13px] font-medium text-muted-foreground">Convites para você</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {invites.map((x) => <RequestCard key={x.request.id} r={x.request} fit={x.fit} matchedSkills={x.matchedSkills} distanceKm={x.distanceKm} invited />)}
          </div>
        </section>
      )}
      {rest.length === 0 && invites.length === 0 ? (
        <EmptyState icon={<Inbox />} title="Tudo atendido por enquanto" description="Avisamos você quando uma indústria publicar uma demanda nas suas áreas." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rest.map((x) => <RequestCard key={x.request.id} r={x.request} fit={x.fit} matchedSkills={x.matchedSkills} distanceKm={x.distanceKm} />)}
        </div>
      )}
    </>
  );
}
