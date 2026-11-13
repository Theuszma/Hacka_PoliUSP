import { requireEngineerUser } from "@/lib/auth";
import { AppShell } from "@/components/shell";

export const dynamic = "force-dynamic";

export default async function EngineerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireEngineerUser();
  return <AppShell user={user}>{children}</AppShell>;
}
