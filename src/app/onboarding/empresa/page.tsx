import { redirect } from "next/navigation";
import { homeFor, requireUser } from "@/lib/auth";
import { CompanyOnboarding } from "@/components/onboarding-company";

export const metadata = { title: "Configurar empresa" };

export default async function Page() {
  const user = await requireUser();
  if (user.role !== "COMPANY" || user.company?.onboardedAt) redirect(homeFor(user));
  return <CompanyOnboarding defaultName={user.name} />;
}
