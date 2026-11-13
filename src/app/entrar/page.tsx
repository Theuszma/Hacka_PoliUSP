import { db } from "@/lib/db";
import { Avatar, Logo, initials } from "@/components/ui";
import { signIn } from "../actions";

export const metadata = { title: "Entrar" };
export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const [companies, engineers, stats] = await Promise.all([
    db.user.findMany({ where: { role: "COMPANY", company: { flows: { some: {} } } }, include: { company: true }, orderBy: { name: "asc" } }),
    db.user.findMany({ where: { role: "ENGINEER" }, include: { engineer: true }, orderBy: { name: "asc" } }),
    Promise.all([db.company.count(), db.engineer.count(), db.supportRequest.count({ where: { status: { not: "DONE" } } })]),
  ]);
  const featuredCompany = companies.find((u) => u.email.startsWith("rosana"));
  const featuredEngineer = engineers.find((u) => u.email.startsWith("ana"));
  const otherCompanies = companies.filter((u) => u.id !== featuredCompany?.id);
  const otherEngineers = engineers.filter((u) => u.id !== featuredEngineer?.id);

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-5 sm:px-6">
        <Logo size={36} />
        <div className="leading-tight">
          <p className="font-display text-xl font-extrabold">Elo</p>
          <p className="text-xs text-muted">Rede de indústria circular</p>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-6 sm:px-6 lg:pt-12">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center">
          <div className="grid gap-5">
            <p className="label">ODS 9 · ODS 12 · Hack@Poli 2026</p>
            <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl">
              O resíduo de uma fábrica é o insumo de outra. <span className="text-accent">A engenharia faz a ponte.</span>
            </h1>
            <p className="max-w-xl text-lg text-muted">
              Pequenas indústrias descobrem quanto perdem em material, encontram parceiros na vizinhança para trocar resíduos e
              recebem apoio de estudantes e engenheiros voluntários da Poli.
            </p>
            <dl className="grid max-w-md grid-cols-3 gap-4 border-t border-line pt-5">
              {[
                ["Empresas", stats[0]],
                ["Engenheiros", stats[1]],
                ["Demandas ativas", stats[2]],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <dt className="label">{k}</dt>
                  <dd className="font-display text-2xl font-extrabold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="grid gap-4">
            <p className="label">Entrar na demonstração como</p>
            {featuredCompany && (
              <form action={signIn}>
                <input type="hidden" name="userId" value={featuredCompany.id} />
                <button className="card group grid w-full gap-3 text-left transition hover:border-accent">
                  <div className="flex items-center gap-3">
                    <Avatar text={featuredCompany.company!.initials} tone="accent" />
                    <div className="min-w-0">
                      <p className="font-semibold">{featuredCompany.company!.name}</p>
                      <p className="text-sm text-muted">{featuredCompany.name} · gestão da produção</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted">Pequena indústria: vê o diagnóstico, simula melhorias, troca resíduos e pede apoio técnico.</p>
                  <span className="text-sm font-semibold text-accent group-hover:underline">Entrar como indústria →</span>
                </button>
              </form>
            )}
            {featuredEngineer && (
              <form action={signIn}>
                <input type="hidden" name="userId" value={featuredEngineer.id} />
                <button className="card group grid w-full gap-3 text-left transition hover:border-accent">
                  <div className="flex items-center gap-3">
                    <Avatar text={initials(featuredEngineer.name)} />
                    <div className="min-w-0">
                      <p className="font-semibold">{featuredEngineer.name}</p>
                      <p className="text-sm text-muted">{featuredEngineer.engineer!.course}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted">Estudante de engenharia: encontra demandas da sua área, assume e registra horas de extensão.</p>
                  <span className="text-sm font-semibold text-accent group-hover:underline">Entrar como engenheira →</span>
                </button>
              </form>
            )}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="card">
            <p className="label mb-3">Outras empresas da rede</p>
            <ul className="grid gap-1">
              {otherCompanies.map((u) => (
                <li key={u.id}>
                  <form action={signIn}>
                    <input type="hidden" name="userId" value={u.id} />
                    <button className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-sunken">
                      <span className="min-w-0 truncate font-medium">{u.company!.name}</span>
                      <span className="shrink-0 text-xs text-muted">{u.company!.city}</span>
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <p className="label mb-3">Outros engenheiros e estudantes</p>
            <ul className="grid gap-1">
              {otherEngineers.map((u) => (
                <li key={u.id}>
                  <form action={signIn}>
                    <input type="hidden" name="userId" value={u.id} />
                    <button className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-sunken">
                      <span className="min-w-0 truncate font-medium">{u.name}</span>
                      <span className="shrink-0 text-xs text-muted">{u.engineer!.kind === "MENTOR" ? "Mentor(a)" : "Estudante"}</span>
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <p className="text-center text-xs text-muted">Protótipo · empresas, pessoas e números fictícios para demonstração.</p>
      </main>
    </div>
  );
}
