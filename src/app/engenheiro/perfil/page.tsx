import { requireEngineerUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { parseSkills } from "@/lib/matching";
import { Avatar, Kpi, PageHeader, Section, initials } from "@/components/ui";

export const metadata = { title: "Meu perfil" };

export default async function ProfilePage() {
  const user = await requireEngineerUser();
  const e = user.engineer;
  const done = await db.supportRequest.findMany({ where: { assigneeId: e.id, status: "DONE" }, include: { company: true } });
  const hours = done.reduce((s, r) => s + r.estimatedHours, 0);
  const saved = done.reduce((s, r) => s + (r.savedPerMonth ?? 0), 0);
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Meu perfil" title={user.name} />
      <div className="card flex flex-wrap items-start gap-4">
        <Avatar text={initials(user.name)} tone={e.kind === "MENTOR" ? "ochre" : "ink"} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{e.course}</p>
          <p className="text-sm text-muted">{e.bio}</p>
          <div className="mt-2 flex flex-wrap gap-1">{parseSkills(e.skills).map((s) => <span key={s} className="tag">{s}</span>)}</div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Horas de extensão" value={`${hours} h`} hint="em demandas concluídas" />
        <Kpi label="Empresas atendidas" value={done.length} />
        <Kpi tone="good" label="Economia gerada" value={money(saved * 12)} unit="/ano" hint="validada pelas empresas" />
      </div>
      <Section title="Certificado de extensão">
        <p className="text-sm text-muted">
          As horas das demandas concluídas, com a validação da empresa e do mentor, compõem o relatório de atividades de extensão para a Pró-Reitoria.
          {done.length ? ` Concluídas: ${done.map((r) => r.company.name).join(", ")}.` : " Conclua uma demanda para começar a acumular horas."}
        </p>
      </Section>
    </div>
  );
}
