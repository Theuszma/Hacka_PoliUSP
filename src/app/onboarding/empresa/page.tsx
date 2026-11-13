import { redirect } from "next/navigation";
import { homeFor, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { CompanyOnboarding, type InputSuggestion } from "@/components/onboarding-company";

export const metadata = { title: "Configurar empresa" };

const round = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

/** As 3 categorias que a rede mais aceita receber, com preço e volume médios. */
async function inputSuggestions(): Promise<InputSuggestion[]> {
  const groups = await db.inputDemand.groupBy({
    by: ["category"],
    where: { licensed: false },
    _avg: { pricePaid: true, virginPrice: true, capacity: true },
    _count: { _all: true },
    orderBy: { _count: { category: "desc" } },
    take: 3,
  });
  return Promise.all(groups.map(async (g) => {
    const latest = await db.inputDemand.findFirst({ where: { category: g.category }, orderBy: { createdAt: "desc" }, select: { description: true } });
    return {
      category: g.category,
      description: latest?.description ?? "",
      pricePaid: round(Math.max(0, g._avg.pricePaid ?? 0)),
      virginPrice: round(g._avg.virginPrice ?? 0),
      capacity: Math.round((g._avg.capacity ?? 0) / 100) * 100,
    };
  }));
}

export default async function Page() {
  const user = await requireUser();
  if (user.role !== "COMPANY" || user.company?.onboardedAt) redirect(homeFor(user));
  return <CompanyOnboarding defaultName={user.name} suggestions={await inputSuggestions()} />;
}
