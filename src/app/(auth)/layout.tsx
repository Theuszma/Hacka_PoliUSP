import { redirect } from "next/navigation";
import { currentUser, homeFor } from "@/lib/auth";
import { Logo } from "@/components/brand";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (user) redirect(homeFor(user));
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-6 py-6 sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</div>
        <p className="text-xs text-muted-foreground">© 2026 Elo · Projeto Hack@Poli</p>
      </div>
      <div className="relative hidden overflow-hidden border-l bg-subtle lg:block">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="relative flex h-full flex-col justify-center gap-8 p-14">
          <blockquote className="max-w-md text-xl font-medium leading-snug tracking-tight">
            “Descobrimos que 22% da chapa virava sucata. Em três semanas, uma estudante da Poli redesenhou o encaixe das peças e um vizinho passou a comprar nossos retalhos.”
          </blockquote>
          <div className="text-[13px] text-muted-foreground">Cenário ilustrativo · Metalúrgica Ipiranga, São Bernardo do Campo</div>
          <dl className="grid max-w-md grid-cols-3 gap-6 border-t pt-6">
            {[["R$ 289 mil", "perda anual encontrada"], ["7", "parceiros a até 15 km"], ["12 h", "de engenharia aplicada"]].map(([v, k]) => (
              <div key={k}><dt className="text-xl font-semibold tracking-tight">{v}</dt><dd className="text-xs text-muted-foreground">{k}</dd></div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
