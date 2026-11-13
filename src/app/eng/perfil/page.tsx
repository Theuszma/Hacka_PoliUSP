import { Clock, Factory, PiggyBank, Star } from "lucide-react";
import { requireEngineerUser } from "@/lib/auth";
import { CITIES } from "@/lib/cities";
import { db } from "@/lib/db";
import { money, num } from "@/lib/format";
import { distanceKm } from "@/lib/geo";
import { parseSkills } from "@/lib/matching";
import { PageHeader } from "@/components/shell";
import { Stat } from "@/components/domain";
import { EngineerProfileForm } from "@/components/onboarding-engineer";
import { Card, CardHeader } from "@/components/ui/card";

export const metadata = { title: "Perfil e horas" };

export default async function ProfilePage() {
  const user = await requireEngineerUser();
  const e = user.engineer;
  const done = await db.supportRequest.findMany({ where: { assigneeId: e.id, status: "DONE" }, include: { company: true }, orderBy: { updatedAt: "desc" } });
  const hours = done.reduce((s, r) => s + r.estimatedHours, 0);
  const saved = done.reduce((s, r) => s + (r.savedPerMonth ?? 0), 0);
  const city = [...CITIES].sort((a, b) => distanceKm(a, e) - distanceKm(b, e))[0]?.name ?? "São Paulo";
  return (
    <>
      <PageHeader title="Perfil e horas" description="Suas horas de extensão e o resultado gerado para as indústrias." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat tone="violet" label="Horas de extensão" value={num(hours)} unit="h" icon={<Clock />} hint={`${done.length} projetos concluídos`} />
        <Stat tone="emerald" label="Economia gerada" value={money(saved)} unit="/mês" icon={<PiggyBank />} hint={`${money(saved * 12)} por ano`} />
        <Stat tone="sky" label="Indústrias atendidas" value={new Set(done.map((r) => r.companyId)).size} icon={<Factory />} />
        <Stat tone="amber" label="Avaliação" value={num(e.rating, 1)} unit="/ 5" icon={<Star />} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div>
          <h2 className="mb-3 text-[13px] font-medium text-muted-foreground">Perfil técnico</h2>
          <EngineerProfileForm initial={{ kind: e.kind, course: e.course, bio: e.bio, skills: parseSkills(e.skills), hoursPerWeek: e.hoursPerWeek, city }} />
        </div>
        <Card>
          <CardHeader title="Histórico de extensão" description="Para o relatório de atividades de extensão" />
          {done.length === 0 ? <p className="px-5 pb-5 text-[13px] text-muted-foreground">As demandas concluídas aparecem aqui.</p> : (
            <div className="divide-y border-t">
              {done.map((r) => (
                <div key={r.id} className="px-5 py-3">
                  <p className="text-[13px] font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{r.company.name} · {r.estimatedHours} h · {r.updatedAt.toLocaleDateString("pt-BR")}{r.savedPerMonth ? ` · −${money(r.savedPerMonth)}/mês` : ""}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
