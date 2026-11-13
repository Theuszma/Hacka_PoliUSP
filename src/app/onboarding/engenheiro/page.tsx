import { redirect } from "next/navigation";
import { homeFor, requireUser } from "@/lib/auth";
import { EngineerOnboarding } from "@/components/onboarding-engineer";

export const metadata = { title: "Configurar perfil" };

export default async function Page() {
  const user = await requireUser();
  if (user.role !== "ENGINEER" || user.engineer) redirect(homeFor(user));
  return <EngineerOnboarding name={user.name} />;
}
