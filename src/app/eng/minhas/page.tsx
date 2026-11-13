import { Briefcase } from "lucide-react";
import Link from "next/link";
import { requireEngineerUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/shell";
import { RequestCard } from "@/components/request-row";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";

export const metadata = { title: "Minhas demandas" };

export default async function MyRequests() {
  const user = await requireEngineerUser();
  const mine = await db.supportRequest.findMany({ where: { assigneeId: user.engineer.id }, include: { company: true }, orderBy: { updatedAt: "desc" } });
  const active = mine.filter((r) => r.status === "IN_PROGRESS");
  const review = mine.filter((r) => r.status === "REVIEW");
  const done = mine.filter((r) => r.status === "DONE");
  return (
    <>
      <PageHeader title="Minhas demandas" description="Projetos que você assumiu." />
      {mine.length === 0 ? (
        <EmptyState icon={<Briefcase />} title="Você ainda não assumiu nenhuma demanda" action={<Link href="/eng" className={buttonVariants()}>Ver demandas abertas</Link>} />
      ) : (
        <div className="grid gap-8">
          {[["Em andamento", active], ["Aguardando revisão de mentor(a)", review], ["Concluídas", done]].map(([title, list]) => (list as typeof mine).length > 0 && (
            <section key={title as string}>
              <h2 className="mb-3 text-[13px] font-medium text-muted-foreground">{title as string} · {(list as typeof mine).length}</h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{(list as typeof mine).map((r) => <RequestCard key={r.id} r={r} />)}</div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
