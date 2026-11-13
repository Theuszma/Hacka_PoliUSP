import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCompanyUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteFlow } from "@/app/actions";
import { FlowForm } from "@/components/flow-form";
import { PageHeader, Section } from "@/components/ui";
import { SubmitButton } from "@/components/client";

export const metadata = { title: "Editar insumo" };

export default async function EditFlowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireCompanyUser();
  const f = await db.materialFlow.findFirst({ where: { id, companyId: user.company.id } });
  if (!f) notFound();

  return (
    <div className="grid gap-6">
      <Link href="/empresa/insumos" className="text-sm font-semibold text-muted hover:text-ink">← Insumos e resíduos</Link>
      <PageHeader eyebrow="Editar insumo" title={f.name} />
      <Section title="Dados do fluxo">
        <FlowForm
          initial={{
            id: f.id, name: f.name, category: f.category, monthlyQty: f.monthlyQty, unitCost: f.unitCost,
            lossRate: Math.round(f.lossRate * 1000) / 10, destination: f.destination, destinationValue: f.destinationValue,
            supplier: f.supplier ?? "", lot: f.lot ?? "",
          }}
        />
      </Section>
      <form action={deleteFlow} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="id" value={f.id} />
        <SubmitButton className="btn border-bad text-bad hover:border-bad" pendingText="Removendo…">Remover insumo</SubmitButton>
        <span className="text-xs text-muted">Remove também as propostas de troca ligadas a ele.</span>
      </form>
    </div>
  );
}
