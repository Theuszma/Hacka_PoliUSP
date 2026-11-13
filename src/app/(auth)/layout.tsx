import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/auth";
import { Logo } from "@/components/brand";
import { money, pct } from "@/lib/format";
import { showcase } from "@/lib/showcase";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (user) redirect(homeFor(user));
  const demo = await showcase();
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-6 py-6 sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</div>
        <p className="text-xs text-muted-foreground">© 2026 Elo · Projeto Hack@Poli</p>
      </div>
      <div className="dark relative hidden overflow-hidden bg-zinc-950 text-white lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_20%_100%,rgba(16,185,129,0.4),transparent_70%),radial-gradient(50%_50%_at_90%_10%,rgba(14,165,233,0.3),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="relative flex h-full flex-col justify-center gap-8 p-14">
          {demo ? (
            <>
              <blockquote className="max-w-md text-xl font-medium leading-snug tracking-tight">
                Na {demo.name}, {pct(demo.topFlow.lossRate)} do insumo “{demo.topFlow.name}” vira resíduo, ou {money(demo.topFlow.loss)} por mês. O Elo mostra onde está a perda e com quem resolver.
              </blockquote>
              <div className="text-[13px] text-muted-foreground">Dados ao vivo da conta de demonstração · {demo.city}</div>
              <dl className="grid max-w-md grid-cols-3 gap-6 border-t pt-6">
                {[[money(demo.yearLoss), "de perda nos últimos 12 meses"], [String(demo.partnersNear), `indústrias da rede a até ${demo.nearKm} km`], [`${money(demo.potential)}/mês`, "em oportunidades encontradas"]].map(([v, k]) => (
                  <div key={k}><dt className="tabular text-xl font-semibold tracking-tight text-emerald-300">{v}</dt><dd className="text-xs text-muted-foreground">{k}</dd></div>
                ))}
              </dl>
            </>
          ) : (
            <blockquote className="max-w-md text-xl font-medium leading-snug tracking-tight">Descubra quanto sua fábrica perde em material e transforme resíduo em margem.</blockquote>
          )}
        </div>
      </div>
    </div>
  );
}
