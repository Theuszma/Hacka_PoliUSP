import { requireCompanyUser } from "@/lib/auth";
import { CompanyShell } from "@/components/shells";

export const dynamic = "force-dynamic";

export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCompanyUser();
  return <CompanyShell user={user}>{children}</CompanyShell>;
}
