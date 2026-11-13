import { requireCompanyUser } from "@/lib/auth";
import { AppShell } from "@/components/shell";

export const dynamic = "force-dynamic";

export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
  const user = await requireCompanyUser();
  return <AppShell user={user}>{children}</AppShell>;
}
