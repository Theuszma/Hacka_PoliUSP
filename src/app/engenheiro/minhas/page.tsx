import { requireEngineerUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { RequestCard } from "@/components/request-card";
import { Empty, PageHeader } from "@/components/ui";
import Link from "next/link";

export const metadata = { title: "Minhas demandas" };

export default async function MyRequestsPage() {
  const user = await requireEngineerUser();
  const mine = await db.supportRequest.findMany({ where: { assigneeId: user.engineer.id }, include: { company: true }, orderBy: { updatedAt: "desc" } });
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Extensão universitária" title="Minhas demandas" />
      {mine.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mine.map((r) => <RequestCard key={r.id} r={r} />)}
        </div>
      ) : (
        <Empty action={<Link href="/engenheiro" className="btn btn-primary">Ver demandas abertas</Link>}>Você ainda não assumiu nenhuma demanda.</Empty>
      )}
    </div>
  );
}
