import { requireCompanyUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/shell";
import { CompanySettingsForm } from "@/components/company-settings";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const user = await requireCompanyUser();
  const members = await db.user.findMany({ where: { companyId: user.company.id }, orderBy: { createdAt: "asc" } });
  return (
    <>
      <PageHeader title="Configurações" description="Dados da empresa e da equipe." />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <Card>
          <CardHeader title="Empresa" description="A localização define quais parceiros aparecem no marketplace; o setor define o benchmark de perdas." />
          <CardBody className="pt-0"><CompanySettingsForm company={user.company} /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Equipe" description={`${members.length} ${members.length > 1 ? "pessoas" : "pessoa"} com acesso`} />
          <div className="divide-y border-t">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={m.name} size={30} />
                <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium">{m.name}</p><p className="truncate text-xs text-muted-foreground">{m.email}</p></div>
                {m.id === user.id && <Badge tone="outline">você</Badge>}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
