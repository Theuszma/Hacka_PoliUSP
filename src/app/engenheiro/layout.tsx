import { requireEngineerUser } from "@/lib/auth";
import { EngineerShell } from "@/components/shells";

export const dynamic = "force-dynamic";

export default async function EngineerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireEngineerUser();
  return <EngineerShell user={user}>{children}</EngineerShell>;
}
